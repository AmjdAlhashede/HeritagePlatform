import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
} from '@mui/material'
import { CloudUpload } from '@mui/icons-material'
import api from '../services/api'

export default function Upload() {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [performerId, setPerformerId] = useState('')
  const [performers, setPerformers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPerformers()
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
      setMessage('فشل تحميل قائمة المؤدين')
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !title || !performerId) {
      setMessage('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setUploading(true)
    setProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 500)

    try {
      // TODO: Implement actual upload
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setProgress(100)
      setMessage('تم رفع الملف بنجاح!')
      
      // Reset form
      setTimeout(() => {
        setFile(null)
        setTitle('')
        setDescription('')
        setPerformerId('')
        setProgress(0)
        setMessage('')
        setUploading(false)
      }, 2000)
    } catch (error) {
      setMessage('فشل رفع الملف')
      setUploading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        رفع محتوى جديد
      </Typography>

      <Card sx={{ maxWidth: 800, mt: 3 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ height: 100 }}
            >
              {file ? file.name : 'اختر ملف فيديو أو صوت'}
              <input
                type="file"
                hidden
                accept="video/*,audio/*"
                onChange={handleFileChange}
              />
            </Button>
          </Box>

          <TextField
            fullWidth
            label="العنوان"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="الوصف"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>المؤدي</InputLabel>
            <Select
              value={performerId}
              onChange={(e) => setPerformerId(e.target.value)}
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

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                جاري الرفع... {progress}%
              </Typography>
            </Box>
          )}

          {message && (
            <Alert severity={message.includes('نجاح') ? 'success' : 'error'} sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleUpload}
            disabled={uploading || !file || !title || !performerId}
          >
            {uploading ? 'جاري الرفع...' : 'رفع الملف'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
