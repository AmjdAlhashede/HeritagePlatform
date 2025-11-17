import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material'
import {
  Videocam,
  Stop,
  PlayArrow,
  Upload,
  Delete,
  Refresh,
} from '@mui/icons-material'
import api from '../services/api'

export default function RecordVideo() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string>('')
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Settings
  const [quality, setQuality] = useState<'720p' | '1080p' | '4K'>('1080p')
  const [format, setFormat] = useState<'video/webm' | 'video/mp4'>('video/webm')
  
  // Upload dialog
  const [uploadDialog, setUploadDialog] = useState(false)
  const [performers, setPerformers] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [performerId, setPerformerId] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchPerformers()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const getVideoConstraints = () => {
    const constraints: any = {
      audio: true,
      video: {
        facingMode: 'user',
      }
    }

    switch (quality) {
      case '720p':
        constraints.video.width = { ideal: 1280 }
        constraints.video.height = { ideal: 720 }
        break
      case '1080p':
        constraints.video.width = { ideal: 1920 }
        constraints.video.height = { ideal: 1080 }
        break
      case '4K':
        constraints.video.width = { ideal: 3840 }
        constraints.video.height = { ideal: 2160 }
        break
    }

    return constraints
  }

  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(getVideoConstraints())
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }

      const options: MediaRecorderOptions = {
        mimeType: format,
        videoBitsPerSecond: quality === '4K' ? 8000000 : quality === '1080p' ? 5000000 : 2500000,
      }

      const recorder = new MediaRecorder(mediaStream, options)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: format })
        setRecordedBlob(blob)
        const url = URL.createObjectURL(blob)
        setRecordedUrl(url)
        
        // Stop all tracks
        mediaStream.getTracks().forEach(track => track.stop())
        setStream(null)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('فشل الوصول للكاميرا. تأكد من السماح بالوصول للكاميرا والميكروفون.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const discardRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedBlob(null)
    setRecordedUrl('')
    setRecordingTime(0)
    setTitle('')
    setDescription('')
    setPerformerId('')
  }

  const handleUpload = async () => {
    if (!recordedBlob || !title || !performerId) {
      alert('يرجى ملء العنوان واختيار المؤدي')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      const filename = `recording-${Date.now()}.${format === 'video/webm' ? 'webm' : 'mp4'}`
      formData.append('file', recordedBlob, filename)

      // Upload to queue first
      const uploadResponse = await api.post('/upload/queue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(percentCompleted)
        },
      })

      // Update metadata and publish
      await api.put(`/upload/queue/${uploadResponse.data.id}`, {
        title,
        description,
        performerId,
      })

      await api.post(`/upload/publish/${uploadResponse.data.id}`)

      alert('✅ تم الرفع والنشر بنجاح!')
      
      // Reset
      discardRecording()
      setUploadDialog(false)
      setUploading(false)
    } catch (error) {
      console.error('Upload error:', error)
      alert('❌ فشل الرفع: ' + (error.response?.data?.message || error.message))
      setUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        تسجيل فيديو جديد
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          📹 سجل فيديو مباشرة من الكاميرا → 👀 عاين التسجيل → ✅ ارفع وانشر
        </Typography>
      </Alert>

      <Card sx={{ maxWidth: 900, mx: 'auto' }}>
        <CardContent>
          {/* Settings */}
          {!isRecording && !recordedBlob && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>الدقة</InputLabel>
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    label="الدقة"
                  >
                    <MenuItem value="720p">HD 720p</MenuItem>
                    <MenuItem value="1080p">Full HD 1080p</MenuItem>
                    <MenuItem value="4K">4K Ultra HD</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>الصيغة</InputLabel>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    label="الصيغة"
                  >
                    <MenuItem value="video/webm">WebM (موصى به)</MenuItem>
                    <MenuItem value="video/mp4">MP4</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* Video Preview */}
          <Box
            sx={{
              position: 'relative',
              paddingTop: '56.25%',
              bgcolor: 'black',
              borderRadius: 1,
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {isRecording ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : recordedUrl ? (
              <video
                ref={previewRef}
                src={recordedUrl}
                controls
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
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
                  color: 'white',
                }}
              >
                <Videocam sx={{ fontSize: 80, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">جاهز للتسجيل</Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
                  اضغط "بدء التسجيل" للبدء
                </Typography>
              </Box>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'error.main',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {formatTime(recordingTime)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {!isRecording && !recordedBlob && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Videocam />}
                onClick={startRecording}
                sx={{ minWidth: 200 }}
              >
                بدء التسجيل
              </Button>
            )}

            {isRecording && (
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<Stop />}
                onClick={stopRecording}
                sx={{ minWidth: 200 }}
              >
                إيقاف التسجيل
              </Button>
            )}

            {recordedBlob && !uploading && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={discardRecording}
                >
                  تسجيل جديد
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => setUploadDialog(true)}
                  sx={{ minWidth: 200 }}
                >
                  رفع ونشر
                </Button>
              </>
            )}
          </Box>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                جاري الرفع... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>معلومات الفيديو</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="العنوان *"
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
            <InputLabel>المؤدي *</InputLabel>
            <Select
              value={performerId}
              onChange={(e) => setPerformerId(e.target.value)}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>إلغاء</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!title || !performerId}
          >
            رفع ونشر
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
