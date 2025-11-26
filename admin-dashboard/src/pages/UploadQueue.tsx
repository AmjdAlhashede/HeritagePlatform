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
  Tooltip,
} from '@mui/material'
import {
  CloudUpload,
  CloudDone,


  Edit,
  Delete,
  CheckCircle,
  HourglassEmpty,
  Visibility,
  Publish,
} from '@mui/icons-material'
import api from '../services/api'

interface QueueItem {
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
  isUploadedToCloud?: boolean
}

export default function UploadQueue() {
  const [tab, setTab] = useState(0)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [performers, setPerformers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Edit Dialog
  const [editDialog, setEditDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    performerId: '',
    originalDate: '',
  })
  
  // Preview Dialog
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState<'video' | 'audio'>('video')

  useEffect(() => {
    fetchQueue()
    fetchPerformers()
  }, [])

  const fetchQueue = async () => {
    try {
      const response = await api.get('/upload/queue')
      setQueue(response.data)
    } catch (error) {
      console.error('Error fetching queue:', error)
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append('file', file)

        await api.post('/upload/queue', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
            setUploadProgress(percentCompleted)
          },
        })

        await fetchQueue()
      } catch (error) {
        console.error('Upload error:', error)
        alert('فشل رفع الملف: ' + file.name)
      }
    }

    setUploading(false)
    setUploadProgress(0)
  }

  const handleEdit = (item: QueueItem) => {
    setCurrentItem(item)
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      performerId: item.performerId || '',
      originalDate: item.originalDate || '',
    })
    setEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!currentItem) return

    try {
      await api.put(`/upload/queue/${currentItem.id}`, editForm)
      setEditDialog(false)
      fetchQueue()
    } catch (error) {
      console.error('Update error:', error)
      alert('فشل التحديث')
    }
  }

  const handlePublish = async (id: string) => {
    if (!confirm('هل أنت متأكد من نشر هذا المحتوى؟ سيتم رفعه للسحابة.')) return

    try {
      await api.post(`/upload/publish/${id}`)
      alert('تم النشر بنجاح! جاري المعالجة والرفع للسحابة...')
      fetchQueue()
    } catch (error: any) {
      console.error('Publish error:', error)
      alert('فشل النشر: ' + (error.response?.data?.message || 'خطأ غير معروف'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحتوى؟')) return

    try {
      await api.delete(`/upload/queue/${id}`)
      fetchQueue()
    } catch (error) {
      console.error('Delete error:', error)
      alert('فشل الحذف')
    }
  }

  const handlePreview = (item: QueueItem) => {
    setPreviewUrl(item.fileUrl)
    setPreviewType(item.type === 'video' ? 'video' : 'audio')
    setPreviewDialog(true)
  }

  const filteredQueue = queue.filter(item => {
    if (tab === 0) return item.status === 'pending'
    if (tab === 1) return item.status === 'published'
    return true
  })

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📦 قائمة الرفع
        </Typography>
        
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          disabled={uploading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 3,
          }}
        >
          رفع ملفات جديدة
          <input
            type="file"
            hidden
            multiple
            accept="video/*,audio/*"
            onChange={handleFilesSelect}
          />
        </Button>
      </Box>

      {/* Upload Progress */}
      {uploading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            جاري الرفع... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab 
          label={`في الانتظار (${queue.filter(i => i.status === 'pending').length})`}
          icon={<HourglassEmpty />}
          iconPosition="start"
        />
        <Tab 
          label={`منشور (${queue.filter(i => i.status === 'published').length})`}
          icon={<CheckCircle />}
          iconPosition="start"
        />
      </Tabs>

      {/* Queue Grid */}
      <Grid container spacing={3}>
        {filteredQueue.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              {tab === 0 ? 'لا توجد ملفات في الانتظار' : 'لا يوجد محتوى منشور'}
            </Alert>
          </Grid>
        )}

        {filteredQueue.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              {/* Thumbnail */}
              <Box
                sx={{
                  height: 180,
                  background: item.thumbnailUrl
                    ? `url(${item.thumbnailUrl})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                {/* Status Badge */}
                <Chip
                  label={item.status === 'pending' ? 'في الانتظار' : 'منشور'}
                  color={item.status === 'pending' ? 'warning' : 'success'}
                  size="small"
                  sx={{ position: 'absolute', top: 8, left: 8 }}
                />

                {/* Cloud Status Badge */}
                {item.isUploadedToCloud && (
                  <Tooltip title="تم الرفع للسحابة">
                    <Chip
                      icon={<CloudDone />}
                      label="☁️ Wasabi"
                      color="info"
                      size="small"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  </Tooltip>
                )}

                {/* Type Badge */}
                <Chip
                  label={item.type === 'video' ? '🎥 فيديو' : '🎵 صوت'}
                  size="small"
                  sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                />

                {/* Duration */}
                {item.duration && item.duration > 0 && (
                  <Chip
                    label={formatDuration(item.duration || 0)}
                    size="small"
                    sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.7)', color: 'white' }}
                  />
                )}
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }} noWrap>
                  {item.title}
                </Typography>

                {item.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description.substring(0, 100)}
                    {item.description.length > 100 && '...'}
                  </Typography>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {item.status === 'pending' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Publish />}
                        onClick={() => handlePublish(item.id)}
                        disabled={!item.performerId}
                      >
                        نشر
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEdit(item)}
                      >
                        تعديل
                      </Button>
                    </>
                  )}

                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handlePreview(item)}
                  >
                    <Visibility />
                  </IconButton>

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

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تعديل المحتوى</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="العنوان"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="الوصف"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <FormControl fullWidth required>
              <InputLabel>المؤدي</InputLabel>
              <Select
                value={editForm.performerId}
                onChange={(e) => setEditForm({ ...editForm, performerId: e.target.value })}
                label="المؤدي"
              >
                {performers.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="التاريخ الأصلي"
              type="date"
              value={editForm.originalDate}
              onChange={(e) => setEditForm({ ...editForm, originalDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>إلغاء</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>معاينة</DialogTitle>
        <DialogContent>
          {previewType === 'video' ? (
            <video
              src={`http://localhost:3000${previewUrl}`}
              controls
              style={{ width: '100%', maxHeight: '500px' }}
            />
          ) : (
            <audio
              src={`http://localhost:3000${previewUrl}`}
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
