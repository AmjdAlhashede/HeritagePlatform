import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Button,
  Divider,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Container,
  Fade,
  Slide,
  LinearProgress,
  Slider,
} from '@mui/material'
import {
  ArrowBack,
  PlayArrow,
  Pause,
  GetApp,
  Visibility,
  ThumbUp,
  Share,
  VolumeUp,
  VolumeOff,
  SkipNext,
  KeyboardArrowDown,
  PictureInPictureAlt,
} from '@mui/icons-material'
import api from '../services/api'

function formatTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'الآن'
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
  if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`
  return `منذ ${Math.floor(diffInSeconds / 604800)} أسبوع`
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function ContentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    playing,
    progress,
    audioRef,
    videoRef,
    setCurrentContent,
    togglePlay: contextTogglePlay,
  } = usePlayer()
  
  const [content, setContent] = useState<any>(null)
  const [suggested, setSuggested] = useState<any[]>([])
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [currentTime, setCurrentTime] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch content only when id changes
  useEffect(() => {
    setLoading(true)
    fetchContent()
    fetchSuggested()
    
    // Scroll only if not from suggested
    const fromSuggested = sessionStorage.getItem('fromSuggested')
    if (!fromSuggested) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    sessionStorage.removeItem('fromSuggested')
  }, [id])

  // Update current time for display
  useEffect(() => {
    if (!content) return
    
    const mediaElement = content.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime)
    }

    mediaElement.addEventListener('timeupdate', handleTimeUpdate)
    return () => mediaElement.removeEventListener('timeupdate', handleTimeUpdate)
  }, [content, videoRef, audioRef])

  const fetchContent = async () => {
    try {
      const response = await api.get(`/content/${id}`)
      const contentData = response.data
      setContent(contentData)
      setCurrentContent(contentData)
      await api.post(`/content/${id}/view`)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggested = async () => {
    try {
      const response = await api.get('/content?limit=10')
      setSuggested(response.data.data.filter((item: any) => item.id !== id))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const togglePlay = () => {
    contextTogglePlay()
  }

  const toggleMute = () => {
    const mediaElement = content?.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return
    mediaElement.muted = !muted
    setMuted(!muted)
  }

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const mediaElement = content?.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return
    const vol = newValue as number
    setVolume(vol)
    mediaElement.volume = vol / 100
  }

  const handleProgressChange = (_: Event, newValue: number | number[]) => {
    const mediaElement = content?.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return
    const prog = newValue as number
    const newTime = (prog / 100) * mediaElement.duration
    mediaElement.currentTime = newTime
  }

  const handleDownload = async () => {
    try {
      await api.post(`/content/${id}/download`)
      alert('سيتم تنزيل الملف قريباً')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleLike = () => {
    setLiked(!liked)
  }

  const handleSuggestedClick = (itemId: string) => {
    sessionStorage.setItem('fromSuggested', 'true')
    navigate(`/content/${itemId}`)
  }

  const handleMinimize = () => {
    // لا نوقف المشغل - فقط نرجع
    navigate(-1)
  }

  if (loading || !content) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  const currentProgress = content.duration > 0 ? (currentTime / content.duration) * 100 : 0

  return (
    <Fade in timeout={400}>
      <Container maxWidth="xl" disableGutters>
        {/* أزرار التحكم */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {/* زر الرجوع للصفحة السابقة */}
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 2,
              border: '2px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
                transform: 'scale(1.1)',
                borderColor: 'primary.main',
              },
              transition: 'all 0.2s',
            }}
            title="رجوع للصفحة السابقة"
          >
            <ArrowBack />
          </IconButton>

          {/* زر التصغير للـ Mini Player */}
          <Button
            variant="contained"
            startIcon={<KeyboardArrowDown />}
            onClick={handleMinimize}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: 2,
              px: 3,
              py: 1,
              borderRadius: 10,
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              transition: 'all 0.3s',
            }}
          >
            تصغير المشغل
          </Button>

          {/* معلومة توضيحية */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              ml: 2,
              px: 2,
              py: 0.5,
              bgcolor: 'info.light',
              borderRadius: 10,
              color: 'info.dark',
            }}
          >
            <PictureInPictureAlt fontSize="small" />
            <Typography variant="caption" fontWeight="600">
              المشغل سيستمر في التشغيل أسفل الشاشة
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', position: 'relative' }}>
              {content.type === 'video' ? (
                <Box sx={{ position: 'relative', aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    src={content.originalFileUrl}
                    poster={content.thumbnailUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onClick={togglePlay}
                  />
                  
                  {/* Video Controls */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      p: 2,
                    }}
                  >
                    <Slider
                      value={currentProgress}
                      onChange={handleProgressChange}
                      sx={{ mb: 1, color: '#f50057' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                        {playing ? <Pause /> : <PlayArrow />}
                      </IconButton>
                      <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                        {muted ? <VolumeOff /> : <VolumeUp />}
                      </IconButton>
                      <Slider
                        value={volume}
                        onChange={handleVolumeChange}
                        sx={{ width: 100, color: 'white' }}
                      />
                      <Typography variant="caption" sx={{ color: 'white', ml: 'auto' }}>
                        {formatDuration(Math.floor(currentTime))} / {formatDuration(content.duration)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    aspectRatio: '16/9',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <audio ref={audioRef} src={content.audioUrl} />
                  
                  {/* Audio Visualizer */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          width: 8,
                          height: playing ? 60 + Math.random() * 40 : 40,
                          bgcolor: 'white',
                          borderRadius: 1,
                          transition: 'height 0.3s',
                          animation: playing ? `wave ${0.5 + i * 0.1}s infinite alternate` : 'none',
                          '@keyframes wave': {
                            '0%': { height: '40px' },
                            '100%': { height: '100px' },
                          },
                        }}
                      />
                    ))}
                  </Box>

                  <IconButton
                    onClick={togglePlay}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      width: 80,
                      height: 80,
                      mb: 3,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    {playing ? <Pause sx={{ fontSize: 40 }} /> : <PlayArrow sx={{ fontSize: 40 }} />}
                  </IconButton>

                  {/* Audio Progress */}
                  <Box sx={{ width: '80%', px: 2 }}>
                    <Slider
                      value={currentProgress}
                      onChange={handleProgressChange}
                      sx={{ color: 'white' }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'white' }}>
                      <Typography variant="caption">
                        {formatDuration(Math.floor(currentTime))}
                      </Typography>
                      <Typography variant="caption">
                        {formatDuration(content.duration)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Volume Control */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                      {muted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                    <Slider
                      value={volume}
                      onChange={handleVolumeChange}
                      sx={{ width: 120, color: 'white' }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {/* Content Info */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {content.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Chip
                    icon={<Visibility />}
                    label={`${content.viewCount.toLocaleString()} مشاهدة`}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {formatTimeAgo(content.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={liked ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<ThumbUp />}
                    onClick={handleLike}
                    sx={{ borderRadius: 10 }}
                  >
                    إعجاب
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Share />}
                    sx={{ borderRadius: 10 }}
                  >
                    مشاركة
                  </Button>
                </Box>
              </Box>

              <Divider />

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  my: 2,
                  cursor: 'pointer',
                  p: 2,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => navigate(`/performers/${content.performer.id}`)}
              >
                <Avatar src={content.performer.imageUrl} sx={{ width: 48, height: 48 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {content.performer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {content.performer.bio}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {content.description || 'لا يوجد وصف'}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<GetApp />}
                size="large"
                onClick={handleDownload}
                sx={{ borderRadius: 10, py: 1.5 }}
              >
                تنزيل ({formatDuration(content.duration)})
              </Button>
            </Box>
          </Grid>

          {/* Suggested Content */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 80 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SkipNext color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  مقترحات لك
                </Typography>
              </Box>
              {suggested.map((item) => (
                <Card
                  key={item.id}
                  sx={{
                    display: 'flex',
                    mb: 1.5,
                    boxShadow: 'none',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(-4px)',
                    },
                  }}
                  onClick={() => handleSuggestedClick(item.id)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      sx={{ width: 168, aspectRatio: '16/9', borderRadius: 1 }}
                      image={item.thumbnailUrl}
                      alt={item.title}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatDuration(item.duration)}
                    </Box>
                  </Box>
                  <CardContent sx={{ flex: 1, py: 0, px: 1.5 }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="600"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.performer?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.viewCount.toLocaleString()} مشاهدة • {formatTimeAgo(item.createdAt)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Fade>
  )
}
