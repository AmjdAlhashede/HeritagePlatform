import { useState, useEffect, useRef } from 'react'
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
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  IconButton,
} from '@mui/material'
import { CloudDownload, CheckCircle, PlaylistPlay, Cancel, Error, HourglassEmpty } from '@mui/icons-material'
import api from '../services/api'

interface ProgressVideo {
  id?: string
  title: string
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped' | 'checking' | 'processing'
  reason?: string
  duration?: number
  error?: string
  index?: number
}

export default function Import() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [performers, setPerformers] = useState([])
  const [categories, setCategories] = useState([])

  // Playlist download
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [playlistPerformerId, setPlaylistPerformerId] = useState('')
  const [playlistCategoryIds, setPlaylistCategoryIds] = useState<string[]>([])
  const [importedVideos, setImportedVideos] = useState<any[]>([])

  // Real-time progress
  const [progressVideos, setProgressVideos] = useState<ProgressVideo[]>([])
  const [cancelledVideos, setCancelledVideos] = useState<Set<string>>(new Set())
  const [currentVideo, setCurrentVideo] = useState<string>('')
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [totalVideos, setTotalVideos] = useState(0)
  const [processedVideos, setProcessedVideos] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetchPerformers()
    fetchCategories()
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleDownloadPlaylist = async () => {
    if (!playlistUrl || !playlistPerformerId) {
      setMessage({ type: 'error', text: 'يرجى إدخال رابط القائمة واختيار المؤدي' })
      return
    }

    setLoading(true)
    setMessage(null)
    setImportedVideos([])
    setProgressVideos([])
    setCurrentVideo('')
    setProgressPercentage(0)
    setTotalVideos(0)
    setProcessedVideos(0)

    try {
      const sessionId = Date.now().toString()
      
      // بدء التحميل
      console.log('🚀 بدء التحميل:', {
        playlistUrl,
        performerId: playlistPerformerId,
        categoryIds: playlistCategoryIds,
        sessionId,
      })
      
      const response = await api.post('/import/auto-download', {
        playlistUrl: playlistUrl,
        performerId: playlistPerformerId,
        categoryIds: playlistCategoryIds,
        maxDuration: 10,
        skipExisting: true,
        sessionId,
      })
      
      console.log('✅ استجابة السيرفر:', response.data)

      // الاتصال بـ SSE للحصول على التحديثات المباشرة
      const token = localStorage.getItem('token')
      
      // تأخير صغير للتأكد من جاهزية الـ Subject في البيكند
      await new Promise(resolve => setTimeout(resolve, 200))
      
      console.log('🔌 Connecting to SSE:', `http://localhost:3000/api/import/progress/${sessionId}`)
      
      const eventSource = new EventSource(
        `http://localhost:3000/api/import/progress/${sessionId}?token=${token}`,
        { withCredentials: true }
      )
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        console.log('📨 Received SSE message:', event.data)
        
        try {
          const data = JSON.parse(event.data)
          console.log('📦 Parsed data:', data)
          
          if (data.status === 'starting') {
            // مرحلة البداية
            setCurrentVideo('جاري بدء التحميل...')
          } else if (data.status === 'video-added') {
            // إضافة فيديو جديد للقائمة
            console.log('➕ Video added:', data.video)
            setTotalVideos(data.total || 0)
            setProgressVideos((prev) => [...prev, data.video])
            setCurrentVideo(`تم جلب ${data.current}/${data.total} فيديو`)
          } else if (data.status === 'video-list') {
            // استلام قائمة الفيديوهات الكاملة (للتوافق مع الكود القديم)
            console.log('📋 Received video list:', data.videos)
            setTotalVideos(data.total || 0)
            setProgressVideos(data.videos || [])
            setCurrentVideo(`تم جلب ${data.total} فيديو - جاري التحميل...`)
          } else if (data.status === 'fetching') {
            // مرحلة جلب المعلومات
            setCurrentVideo(data.video || 'جلب معلومات الفيديوهات...')
            setTotalVideos(data.total || 0)
            setProcessedVideos(data.current || 0)
            setProgressPercentage(data.percentage || 0)
          } else if (data.status === 'checking' || data.status === 'downloading' || data.status === 'processing') {
            setCurrentVideo(data.stage ? `${data.video} - ${data.stage}` : data.video)
            setTotalVideos(data.total || 0)
            setProcessedVideos(data.current || 0)
            setProgressPercentage(data.percentage || 0)
            
            // تحديث قائمة الفيديوهات بناءً على videoIndex
            if (data.videoIndex !== undefined) {
              setProgressVideos((prev) =>
                prev.map((v, idx) =>
                  idx === data.videoIndex
                    ? { ...v, status: data.status }
                    : v
                )
              )
            }
          } else if (data.status === 'completed') {
            if (data.videoIndex !== undefined) {
              setProgressVideos((prev) =>
                prev.map((v, idx) =>
                  idx === data.videoIndex
                    ? { ...v, status: 'completed' }
                    : v
                )
              )
            }
          } else if (data.status === 'failed') {
            if (data.videoIndex !== undefined) {
              setProgressVideos((prev) =>
                prev.map((v, idx) =>
                  idx === data.videoIndex
                    ? { ...v, status: 'failed', error: data.error }
                    : v
                )
              )
            }
          } else if (data.status === 'skipped') {
            if (data.videoIndex !== undefined) {
              setProgressVideos((prev) =>
                prev.map((v, idx) =>
                  idx === data.videoIndex
                    ? { ...v, status: 'skipped', reason: data.reason }
                    : v
                )
              )
            }
          } else if (data.status === 'done') {
            console.log('✅ Download completed!')
            setLoading(false)
            setMessage({
              type: 'success',
              text: `✅ تم تحميل ${data.downloaded || 0} فيديو، تخطي ${data.skipped || 0}, فشل ${data.failed || 0}`,
            })
            setImportedVideos(data.videos || [])
            eventSource.close()
          } else if (data.status === 'error') {
            console.error('❌ Download error:', data.error)
            setLoading(false)
            setMessage({
              type: 'error',
              text: data.error || 'فشل التحميل',
            })
            eventSource.close()
          }
        } catch (parseError) {
          console.error('❌ Failed to parse SSE data:', parseError)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ SSE Error:', error)
        console.error('EventSource readyState:', eventSource.readyState)
        
        // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (eventSource.readyState === 2) {
          // الاتصال مغلق - قد يكون انتهى بشكل طبيعي
          console.log('SSE connection closed')
        } else {
          // خطأ حقيقي
          setLoading(false)
          setMessage({
            type: 'error',
            text: 'فشل الاتصال بالسيرفر - تأكد من تشغيل Backend على المنفذ 3000',
          })
          eventSource.close()
        }
      }
      
      eventSource.onopen = () => {
        console.log('✅ SSE connection opened')
      }
    } catch (error: any) {
      setLoading(false)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'فشل بدء التحميل',
      })
    }
  }

  const handleCancelDownload = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setLoading(false)
    setMessage({ type: 'error', text: 'تم إلغاء التحميل' })
  }

  const handleCancelVideo = (videoId: string, videoTitle: string) => {
    console.log('🚫 Cancelling video:', videoId, videoTitle)
    
    // إضافة للقائمة الملغاة
    setCancelledVideos(prev => {
      const newSet = new Set(prev)
      newSet.add(videoId)
      return newSet
    })
    
    // تحديث حالة الفيديو في القائمة
    setProgressVideos(prev =>
      prev.map(v =>
        v.id === videoId
          ? { ...v, status: 'skipped', reason: 'ملغى من المستخدم' }
          : v
      )
    )
    
    // TODO: إرسال للـ backend (في المستقبل)
    // يمكن إضافة API endpoint لإلغاء فيديو معين
  }

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const detectSource = (url: string) => {
    if (url.includes('aparat.com')) return 'Aparat ✅'
    if (url.includes('twitter.com') || url.includes('x.com') || url.includes('@')) return 'Twitter/X ✅'
    if (!url.includes('http') && !url.includes('.') && url.length > 0) return 'Twitter/X (اسم مستخدم) ✅'
    return 'غير مدعوم ❌'
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        استيراد المحتوى
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          ✅ تحميل ورفع تلقائي - بدون إعلانات!
        </Typography>
        <Typography variant="body2">
          السيرفر يحمل الفيديوهات ويرفعها على R2 الخاص بك - تحكم كامل بدون إعلانات خارجية
        </Typography>
      </Alert>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CloudDownload sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">
                تحميل ورفع تلقائي من Aparat و Twitter/X
              </Typography>
              <Typography variant="body2" color="text.secondary">
                السيرفر يحمل كل الفيديوهات ويرفعها على R2 - بدون إعلانات!
              </Typography>
            </Box>
          </Box>

          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              ✅ المميزات:
            </Typography>
            <Typography variant="body2" component="div">
              • تحميل تلقائي من Aparat<br />
              • رفع على R2 الخاص بك - ملكية كاملة بدون إعلانات<br />
              • فقط الفيديوهات أقل من 10 دقائق (تلقائي)<br />
              • لا يكرر الرفع - نظام Hash ذكي<br />
              • استخراج المعلومات تلقائياً
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              📋 كيفية الاستخدام:
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Twitter/X (رابط تغريدة واحدة):</strong><br />
              • <code>https://twitter.com/username/status/1234567890</code><br />
              <br />
              <strong>Aparat (رابط قائمة):</strong><br />
              • <code>https://www.aparat.com/playlist/xxxxx</code><br />
              <br />
              💡 النظام يجلب تلقائياً الفيديوهات أقل من 10 دقائق فقط<br />
              💡 لتحميل عدة فيديوهات من Twitter/X، استخدم رابط كل تغريدة على حدة
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="رابط القائمة أو اسم المستخدم"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="@username أو https://twitter.com/username أو https://www.aparat.com/playlist/xxxxx"
            margin="normal"
            helperText={playlistUrl ? `المصدر: ${detectSource(playlistUrl)}` : 'يدعم: Twitter/X (اسم المستخدم أو رابط) و Aparat (قوائم)'}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>المؤدي</InputLabel>
            <Select
              value={playlistPerformerId}
              onChange={(e) => setPlaylistPerformerId(e.target.value)}
              label="المؤدي"
            >
              <MenuItem value="">اختر المؤدي</MenuItem>
              {performers.map((performer: any) => (
                <MenuItem key={performer.id} value={performer.id}>
                  {performer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>التصنيفات (اختياري)</InputLabel>
            <Select
              multiple
              value={playlistCategoryIds}
              onChange={(e) => setPlaylistCategoryIds(e.target.value as string[])}
              label="التصنيفات (اختياري)"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const cat = categories.find((c: any) => c.id === value)
                    return <Chip key={value} label={(cat as any)?.name} size="small" />
                  })}
                </Box>
              )}
            >
              {categories.map((category: any) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <PlaylistPlay />}
              onClick={handleDownloadPlaylist}
              disabled={loading || !playlistUrl || !playlistPerformerId}
            >
              {loading ? 'جاري التحميل والرفع...' : 'تحميل ورفع القائمة'}
            </Button>
            {loading && (
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<Cancel />}
                onClick={handleCancelDownload}
              >
                إلغاء
              </Button>
            )}
          </Box>

          {/* عرض التقدم المباشر */}
          {loading && totalVideos > 0 && (
            <Card variant="outlined" sx={{ mt: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">
                      التقدم: {processedVideos} / {totalVideos}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {progressPercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>

                {currentVideo && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      🔄 يتم معالجة: {currentVideo}
                    </Typography>
                  </Alert>
                )}

                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📋 قائمة الانتظار ({progressVideos.length} فيديو)
                </Typography>
                <List sx={{ maxHeight: 500, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 2, p: 1 }}>
                  {progressVideos.map((video, index) => (
                    <Card 
                      key={index}
                      variant="outlined"
                      sx={{
                        mb: 1.5,
                        transition: 'all 0.3s ease',
                        border: video.status === 'downloading' || video.status === 'processing' 
                          ? '2px solid' 
                          : '1px solid',
                        borderColor: video.status === 'downloading' || video.status === 'processing'
                          ? 'primary.main'
                          : video.status === 'completed'
                          ? 'success.main'
                          : video.status === 'failed'
                          ? 'error.main'
                          : 'divider',
                        bgcolor: video.status === 'downloading' || video.status === 'processing' 
                          ? 'action.hover' 
                          : 'background.paper',
                        boxShadow: video.status === 'downloading' || video.status === 'processing' 
                          ? 3 
                          : 0,
                        '&:hover': {
                          boxShadow: 2,
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          {/* Artwork / Icon */}
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: 2,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            {/* الصورة المصغرة */}
                            {video.artwork && (
                              <Box
                                component="img"
                                src={video.artwork}
                                alt={video.title}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            )}
                            
                            {/* Overlay للحالة */}
                            {(video.status === 'downloading' || video.status === 'processing' || video.status === 'checking') && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CircularProgress size={40} sx={{ color: 'white' }} />
                              </Box>
                            )}
                            {video.status === 'completed' && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(76, 175, 80, 0.8)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 50, color: 'white' }} />
                              </Box>
                            )}
                            {video.status === 'failed' && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(244, 67, 54, 0.8)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Error sx={{ fontSize: 50, color: 'white' }} />
                              </Box>
                            )}
                            {video.status === 'skipped' && !video.artwork && (
                              <HourglassEmpty sx={{ fontSize: 50, color: 'warning.main' }} />
                            )}
                            {video.status === 'pending' && !video.artwork && (
                              <HourglassEmpty sx={{ fontSize: 50, color: 'grey.400' }} />
                            )}
                            
                            {/* Badge للرقم */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                bgcolor: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                borderRadius: 1,
                                px: 1,
                                py: 0.5,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              #{index + 1}
                            </Box>
                          </Box>

                          {/* Content */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: video.status === 'downloading' || video.status === 'processing' ? 'bold' : 'normal',
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {video.title}
                              </Typography>
                              
                              {/* Cancel Button - يظهر للفيديوهات في الانتظار أو قيد الفحص */}
                              {(video.status === 'pending' || video.status === 'checking') && video.id && (
                                <IconButton 
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelVideo(video.id!, video.title)}
                                  title="إلغاء هذا الفيديو"
                                  sx={{ ml: 1 }}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              )}
                            </Box>

                            {/* Metadata */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                              {video.duration && (
                                <Chip 
                                  label={`⏱️ ${video.duration} دقيقة`} 
                                  size="small" 
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                              
                              {/* Status Chip */}
                              <Chip 
                                label={
                                  video.status === 'pending' ? '⏳ في الانتظار' :
                                  video.status === 'checking' ? '🔍 فحص' :
                                  video.status === 'downloading' ? '⬇️ تحميل' :
                                  video.status === 'processing' ? '⚙️ معالجة' :
                                  video.status === 'completed' ? '✅ تم' :
                                  video.status === 'failed' ? '❌ فشل' :
                                  video.status === 'skipped' ? '⏭️ تخطي' : video.status
                                }
                                size="small"
                                color={
                                  video.status === 'completed' ? 'success' :
                                  video.status === 'failed' ? 'error' :
                                  video.status === 'downloading' || video.status === 'processing' ? 'primary' :
                                  video.status === 'skipped' ? 'warning' : 'default'
                                }
                                variant={video.status === 'downloading' || video.status === 'processing' ? 'filled' : 'outlined'}
                              />
                            </Box>

                            {/* Status Message */}
                            {video.status === 'failed' && video.error && (
                              <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                                <Typography variant="caption">{video.error}</Typography>
                              </Alert>
                            )}
                            {video.status === 'skipped' && video.reason && (
                              <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                                <Typography variant="caption">{video.reason}</Typography>
                              </Alert>
                            )}
                            {video.status === 'completed' && (
                              <Alert severity="success" sx={{ mt: 1, py: 0 }}>
                                <Typography variant="caption">تم التحميل والرفع بنجاح</Typography>
                              </Alert>
                            )}
                            {(video.status === 'downloading' || video.status === 'processing') && (
                              <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {importedVideos.length > 0 && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  الفيديوهات المستوردة ({importedVideos.length})
                </Typography>
                <List>
                  {importedVideos.map((video, index) => (
                    <ListItem key={video.id}>
                      <CheckCircle color="success" sx={{ mr: 2 }} />
                      <ListItemText
                        primary={video.title}
                        secondary={`${Math.floor(video.duration / 60)} دقيقة`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          💡 كيف يعمل النظام؟
        </Typography>
        <Typography variant="body2" component="div">
          1. تعطي رابط قائمة تشغيل من Aparat أو قناة Twitter/X<br />
          2. السيرفر يحمل كل الفيديوهات تلقائياً (أقل من 10 دقائق فقط)<br />
          3. يرفعها على R2 الخاص بك - ملكية كاملة<br />
          4. يستخرج المعلومات والتاريخ تلقائياً<br />
          5. لا يكرر الرفع - نظام Hash ذكي
        </Typography>
      </Alert>
    </Box>
  )
}
