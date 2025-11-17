import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Add, Edit, Delete, PlayArrow, CloudUpload } from '@mui/icons-material'
import api from '../services/api'

export default function Content() {
  const [content, setContent] = useState([])
  const [performers, setPerformers] = useState([])
  const [open, setOpen] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentContent, setCurrentContent] = useState({
    title: '',
    description: '',
    performerId: '',
    type: 'audio',
    duration: 0,
    thumbnailUrl: '',
    videoUrl: '',
    audioUrl: '',
  })

  useEffect(() => {
    fetchContent()
    fetchPerformers()
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const fetchContent = async () => {
    try {
      const response = await api.get('/content')
      setContent(response.data.data)
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const handleOpen = () => {
    setCurrentContent({
      title: '',
      description: '',
      performerId: '',
      type: 'audio',
      duration: 0,
      thumbnailUrl: '',
      videoUrl: '',
      audioUrl: '',
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSave = async () => {
    try {
      await api.post('/content', {
        ...currentContent,
        fileSize: 5000000,
        views: 0,
        likes: 0,
        downloads: 0,
      })
      fetchContent()
      handleClose()
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
      try {
        await api.delete(`/content/${id}`)
        fetchContent()
      } catch (error) {
        console.error('Error deleting content:', error)
      }
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const filteredAndSortedContent = content
    .filter((item) => {
      // Filter by type
      if (filterType !== 'all' && item.type !== filterType) return false
      // Filter by status
      if (filterStatus === 'published' && !item.isProcessed) return false
      if (filterStatus === 'pending' && item.isProcessed) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'popular':
          return b.viewCount - a.viewCount
        case 'trending':
          return b.downloadCount - a.downloadCount
        case 'title':
          return a.title.localeCompare(b.title, 'ar')
        default:
          return 0
      }
    })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">إدارة المحتوى</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="الحالة"
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="published">منشور</MenuItem>
              <MenuItem value="pending">في الانتظار</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>النوع</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="النوع"
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="video">فيديو</MenuItem>
              <MenuItem value="audio">صوت</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>الترتيب</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="الترتيب"
            >
              <MenuItem value="newest">الأحدث</MenuItem>
              <MenuItem value="popular">الأكثر مشاهدة</MenuItem>
              <MenuItem value="trending">الأكثر تنزيلاً</MenuItem>
              <MenuItem value="title">العنوان (أ-ي)</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
            إضافة محتوى
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الصورة</TableCell>
              <TableCell>العنوان</TableCell>
              <TableCell>المؤدي</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>المدة</TableCell>
              <TableCell>المشاهدات</TableCell>
              <TableCell>التنزيلات</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedContent.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    لا يوجد محتوى حالياً
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedContent.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Avatar
                      src={item.thumbnailUrl}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    >
                      <PlayArrow />
                    </Avatar>
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.performer?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.type === 'video' ? 'فيديو' : 'صوت'}
                      color={item.type === 'video' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isProcessed ? 'منشور' : 'في الانتظار'}
                      color={item.isProcessed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDuration(item.duration)}</TableCell>
                  <TableCell>{item.viewCount}</TableCell>
                  <TableCell>{item.downloadCount}</TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة محتوى جديد</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="العنوان"
            value={currentContent.title}
            onChange={(e) =>
              setCurrentContent({ ...currentContent, title: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="الوصف"
            value={currentContent.description}
            onChange={(e) =>
              setCurrentContent({ ...currentContent, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>المؤدي</InputLabel>
            <Select
              value={currentContent.performerId}
              onChange={(e) =>
                setCurrentContent({ ...currentContent, performerId: e.target.value })
              }
              label="المؤدي"
            >
              <MenuItem value="">اختر المؤدي</MenuItem>
              {performers.map((performer) => (
                <MenuItem key={performer.id} value={performer.id}>
                  {performer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>النوع</InputLabel>
            <Select
              value={currentContent.type}
              onChange={(e) =>
                setCurrentContent({ ...currentContent, type: e.target.value })
              }
              label="النوع"
            >
              <MenuItem value="audio">صوت</MenuItem>
              <MenuItem value="video">فيديو</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="المدة (بالثواني)"
            type="number"
            value={currentContent.duration}
            onChange={(e) =>
              setCurrentContent({ ...currentContent, duration: parseInt(e.target.value) || 0 })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="رابط الصورة المصغرة"
            value={currentContent.thumbnailUrl}
            onChange={(e) =>
              setCurrentContent({ ...currentContent, thumbnailUrl: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="رابط الصوت"
            value={currentContent.audioUrl}
            onChange={(e) =>
              setCurrentContent({ ...currentContent, audioUrl: e.target.value })
            }
            margin="normal"
          />
          {currentContent.type === 'video' && (
            <TextField
              fullWidth
              label="رابط الفيديو"
              value={currentContent.videoUrl}
              onChange={(e) =>
                setCurrentContent({ ...currentContent, videoUrl: e.target.value })
              }
              margin="normal"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleSave} variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
