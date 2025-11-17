import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import {
  CloudUpload,
  PlayArrow,
  Edit,
  Delete,
  CheckCircle,
  HourglassEmpty,
  Visibility,
} from '@mui/icons-material'
import api from '../services/api'

interface ContentItem {
  id: string
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl?: string
  duration?: number
  status: 'pending' | 'published'
  performerId?: string
  originalDate?: string
  type: string
}

export default function Upload() {
  const [tab, setTab] = useState(0)
  const [content, setContent] = useState<ContentItem[]>([])
  const [performers, setPerformers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Edit Dialog
  const [editDialog, setEditDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null)
  
  // Preview Dialog
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState<'video' | 'audio'>('video')

  useEffect(() => {
    fetchContent()
    fetchPerformers()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await api.get('/upload/queue')
      setContent(response.data)
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append('file', file)

        await api.post('/upload/queue', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(percentCompleted)
          },
        })

        // Refresh content list
        await fetchContent()
      } catch (error) {
        console.error('Upload error:', error)
        alert(`فشل رفع الملف: ${file.name}`)
      }
    }

    setUploading(false)
    setUploadProgress(0)
    e.target.value = ''
  }

  const handleEdit = (item: ContentItem) => {
    setCurrentItem(item)
    setEditDialog(true)
  }

  const handleSave = async () => {
    if (!currentItem || !currentItem.title || !currentItem.performerId) {
      alert('يرجى ملء العنوان واختيار المؤدي')
      return
    }

    try {
      // Update metadata first
      await api.put(`/upload/queue/${currentItem.id}`, {
        title: currentItem.title,
        description: currentItem.description,
        performerId: currentItem.performerId,
        originalDate: currentItem.originalDate,
      })

      // Publish if it was pending (this triggers FFmpeg processing)
      if (currentItem.status === 'pending') {
        const response = await api.post(`/upload/publish/${currentItem.id}`)
        alert(response.data.message || 'تم النشر بنجاح!')
      }

      // Refresh
      await fetchContent()
      setEditDialog(false)
      setCurrentItem(null)
    } catch (error) {
      console.error('Save error:', error)
      alert('فشل الحفظ: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟')) return

    try {
      await api.delete(`/upload/queue/${id}`)
      await fetchContent()
    } catch (error) {
      console.error('Delete error:', error)
      alert('فشل الحذف')
    }
  }

  const handlePreview = (item: ContentItem) => {
    setPreviewUrl(`http://localhost:3000${item.fileUrl}`)
    setPreviewType(item.type === 'video' ? 'video' : 'audio')
    setPreviewDialog(true)
  }

  const pendingContent = content.filter((item) => item.status === 'pending')
  const publishedContent = content.filter((item) => item.status === 'published')
  const displayContent = tab === 0 ? pendingContent : publishedContent

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">إدارة المحتوى</Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          size="large"
          disabled={uploading}
        >
          {uploading ? `جاري الرفع ${uploadProgress}%` : 'رفع ملفات'}
          <input
            type="file"
            hidden
            multiple
            accept="video/*,audio/*"
            onChange={handleFilesSelect}
          />
        </Button>
      </Box>

      {uploading && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              جاري رفع الملفات... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </CardContent>
        </Card>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          📤 ارفع الملفات → 📝 أدخل المعلومات → ✅ انشر المحتوى
        </Typography>
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HourglassEmpty />
                في الانتظار ({pendingContent.length})
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle />
                منشور ({publishedContent.length})
              </Box>
            }
          />
        </Tabs>
      </Box>

      {displayContent.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {tab === 0 ? 'لا يوجد محتوى في الانتظار' : 'لا يوجد محتوى منشور'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {tab === 0 ? 'ابدأ برفع ملفات جديدة' : 'قم بنشر المحتوى من قائمة الانتظار'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {displayContent.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  border: item.status === 'published' ? '2px solid' : '1px solid',
                  borderColor: item.status === 'published' ? 'success.main' : 'warning.main',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '56.25%',
                    bgcolor: 'black',
                    cursor: 'pointer',
                  }}
                  onClick={() => handlePreview(item)}
                >
                  {item.thumbnailUrl ? (
                    <img
                      src={`http://localhost:3000${item.thumbnailUrl}`}
                      alt={item.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        // إذا فشل تحميل الصورة، عرض placeholder
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {!item.thumbnailUrl && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.7)',
                      }}
                    >
                      <Typography color="white" variant="h4" sx={{ mb: 1 }}>
                        {item.type === 'video' ? '🎬' : '🎵'}
                      </Typography>
                      <Typography color="white" variant="body2">
                        {item.type === 'video' ? 'فيديو' : 'صوت'}
                      </Typography>
                    </Box>
                  )}

                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    }}
                  >
                    <PlayArrow sx={{ fontSize: 40 }} />
                  </IconButton>

                  <Chip
                    icon={item.status === 'published' ? <CheckCircle /> : <HourglassEmpty />}
                    label={item.status === 'published' ? 'منشور' : 'في الانتظار'}
                    size="small"
                    color={item.status === 'published' ? 'success' : 'warning'}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  />
                </Box>

                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {item.title || 'بدون عنوان'}
                  </Typography>
                  
                  {item.description && (
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
                      {item.description}
                    </Typography>
                  )}
                  
                  {!item.description && item.status === 'pending' && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                      ⚠️ يحتاج معلومات للنشر
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                    {item.duration && (
                      <Typography variant="caption" color="text.secondary">
                        ⏱️ المدة: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                      </Typography>
                    )}
                    {item.originalDate && (
                      <Typography variant="caption" color="primary.main" fontWeight="600">
                        📅 {new Date(item.originalDate).toLocaleDateString('ar-SA')}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handlePreview(item)}
                      fullWidth
                    >
                      معاينة
                    </Button>
                    <Button
                      variant={item.status === 'pending' ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(item)}
                      fullWidth
                    >
                      {item.status === 'pending' ? 'نشر' : 'تعديل'}
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit/Publish Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentItem?.status === 'pending' ? '📝 نشر المحتوى' : '✏️ تعديل المحتوى'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="العنوان *"
            value={currentItem?.title || ''}
            onChange={(e) =>
              setCurrentItem((prev) => (prev ? { ...prev, title: e.target.value } : null))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="الوصف"
            value={currentItem?.description || ''}
            onChange={(e) =>
              setCurrentItem((prev) => (prev ? { ...prev, description: e.target.value } : null))
            }
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>المؤدي *</InputLabel>
            <Select
              value={currentItem?.performerId || ''}
              onChange={(e) =>
                setCurrentItem((prev) => (prev ? { ...prev, performerId: e.target.value } : null))
              }
              label="المؤدي *"
            >
              <MenuItem value="">اختر المؤدي</MenuItem>
              {performers.map((performer: any) => (
                <MenuItem key={performer.id} value={performer.id}>
                  {performer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="تاريخ الإنشاء الأصلي (اختياري)"
            type="date"
            value={currentItem?.originalDate || ''}
            onChange={(e) =>
              setCurrentItem((prev) => (prev ? { ...prev, originalDate: e.target.value } : null))
            }
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            helperText="للمقاطع التراثية القديمة"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentItem?.title || !currentItem?.performerId}
          >
            {currentItem?.status === 'pending' ? '✅ نشر الآن' : '💾 حفظ التعديلات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>معاينة المحتوى</DialogTitle>
        <DialogContent>
          {previewType === 'video' ? (
            <video
              src={previewUrl}
              controls
              style={{ width: '100%', maxHeight: '70vh' }}
            />
          ) : (
            <audio
              src={previewUrl}
              controls
              style={{ width: '100%' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
