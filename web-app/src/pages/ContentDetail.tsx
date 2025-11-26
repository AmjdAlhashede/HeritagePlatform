import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Divider,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Container,
  Fade,
  LinearProgress,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  SkipNext,
  SkipPrevious,
  PlayArrow,
  Headphones,
} from '@mui/icons-material'
import api from '../services/api'

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const hijri = date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const gregorian = date.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  return `${hijri} - ${gregorian}`
}

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
  const [searchParams] = useSearchParams()
  const preferredType = searchParams.get('type')

  const {
    audioRef,
    videoRef,
    setCurrentContent,
  } = usePlayer()

  const [content, setContent] = useState<any>(null)
  const [suggested, setSuggested] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Autoplay State
  const [autoplayNext, setAutoplayNext] = useState(false)
  const [countdown, setCountdown] = useState(8)
  const [nextContent, setNextContent] = useState<any>(null)

  const viewTracked = useRef(false)

  // Define functions first to avoid "used before defined" errors
  const fetchContent = async () => {
    try {
      const response = await api.get(`/content/${id}`)
      let contentData = response.data

      // Force type if specified in URL
      if (preferredType && (preferredType === 'audio' || preferredType === 'video')) {
        contentData = { ...contentData, type: preferredType }
      }

      setContent(contentData)
      setCurrentContent(contentData)

      const viewedItems = sessionStorage.getItem('viewedContent')
      const viewedList = viewedItems ? JSON.parse(viewedItems) : []

      if (!viewedList.includes(id) && !viewTracked.current) {
        await api.post(`/content/${id}/view`)
        viewedList.push(id)
        sessionStorage.setItem('viewedContent', JSON.stringify(viewedList))
        viewTracked.current = true
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggested = async () => {
    try {
      // Fetch more items to allow for better randomization
      const response = await api.get('/content?limit=50')
      let allContent = response.data.data.filter((item: any) => item.id !== id)

      // Shuffle array
      for (let i = allContent.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allContent[i], allContent[j]] = [allContent[j], allContent[i]];
      }

      // Take first 10
      setSuggested(allContent.slice(0, 10))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSuggestedClick = (itemId: string) => {
    sessionStorage.setItem('fromSuggested', 'true')
    navigate(`/content/${itemId}`)
  }

  const handleMediaEnded = () => {
    if (suggested.length > 0) {
      setNextContent(suggested[0])
      setAutoplayNext(true)
      setCountdown(8)
    }
  }

  const cancelAutoplay = () => {
    setAutoplayNext(false)
    setCountdown(8)
  }

  const playNextNow = () => {
    if (nextContent) {
      navigate(`/content/${nextContent.id}?type=${content.type}`)
    }
  }

  useEffect(() => {
    setLoading(true)
    viewTracked.current = false
    fetchContent()
    fetchSuggested()

    const fromSuggested = sessionStorage.getItem('fromSuggested')
    if (!fromSuggested) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    sessionStorage.removeItem('fromSuggested')

    // Reset autoplay state on new content load
    setAutoplayNext(false)
    setCountdown(8)
    setNextContent(null)
  }, [id, preferredType])

  // Autoplay Countdown Effect
  useEffect(() => {
    if (autoplayNext && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (autoplayNext && countdown === 0 && nextContent) {
      navigate(`/content/${nextContent.id}?type=${content.type}`)
      setAutoplayNext(false)
      setCountdown(8)
    }
  }, [autoplayNext, countdown, nextContent, navigate, content])

  useEffect(() => {
    if (!content) return

    const playMedia = async () => {
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100))

      const startTime = parseFloat(searchParams.get('t') || '0')

      if (content.type === 'video' && videoRef.current) {
        const video = videoRef.current
        const videoUrl = content.cloudVideoUrl || content.originalFileUrl

        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }

        if (videoUrl) {
          video.src = videoUrl
          video.currentTime = startTime
          video.load()

          try {
            const playPromise = video.play()
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log('Video play failed:', error)
              })
            }
          } catch (error) {
            console.log('Video play failed:', error)
          }
        }
      } else if (content.type === 'audio' && audioRef.current) {
        const audio = audioRef.current
        const audioUrl = content.cloudAudioUrl || content.audioUrl

        if (videoRef.current) {
          videoRef.current.pause()
          videoRef.current.src = ''
        }

        if (audioUrl) {
          audio.src = audioUrl
          audio.currentTime = startTime
          audio.load()

          try {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log('Audio play failed:', error)
              })
            }
          } catch (error) {
            console.log('Audio play failed:', error)
          }
        }
      }
    }

    playMedia()

    return () => {
      if (videoRef.current) {
        videoRef.current.pause()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [content, id])

  if (loading || !content) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Fade in timeout={400}>
      <Container maxWidth="xl" disableGutters>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            {/* Player Container */}
            <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'black', position: 'relative', aspectRatio: '16/9' }}>
              {content.type === 'video' ? (
                <video
                  key={content.id}
                  ref={videoRef}
                  poster={content.thumbnailUrl}
                  controls={!autoplayNext}
                  playsInline
                  onEnded={handleMediaEnded}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    backgroundImage: `url(${content.thumbnailUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.1))',
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 2, p: 2, width: '100%' }}>
                    <audio
                      key={content.id}
                      ref={audioRef}
                      src={content.cloudAudioUrl || content.audioUrl}
                      controls={!autoplayNext}
                      onEnded={handleMediaEnded}
                      style={{
                        width: '100%',
                        height: 40,
                        filter: 'invert(1) hue-rotate(180deg)',
                        opacity: 0.9,
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Navigation Overlays (Show on Hover) */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 5,
                  pointerEvents: 'none', // Allow clicking through to video
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  '&:hover': { opacity: 1 },
                  // Also show when hovering the parent container
                  '.MuiBox-root:hover > &': { opacity: 1 },
                }}
              >
                {/* Previous Button */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(-1)
                  }}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 16, // Arabic RTL: Previous is on the right
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    pointerEvents: 'auto',
                    '&:hover': { bgcolor: 'primary.main' },
                    width: 48,
                    height: 48,
                  }}
                >
                  <SkipNext sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>

                {/* Next Button */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    playNextNow()
                  }}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 16, // Arabic RTL: Next is on the left
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    pointerEvents: 'auto',
                    '&:hover': { bgcolor: 'primary.main' },
                    width: 48,
                    height: 48,
                  }}
                >
                  <SkipPrevious sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
              </Box>

              {/* Autoplay Overlay */}
              {autoplayNext && nextContent && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.85)',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" color="white" gutterBottom>
                    التالي خلال {countdown}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, maxWidth: 600 }}>
                    <CardMedia
                      component="img"
                      image={nextContent.thumbnailUrl}
                      sx={{ width: 120, aspectRatio: '16/9', borderRadius: 1 }}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" color="white" fontWeight="bold">
                        {nextContent.title}
                      </Typography>
                      <Typography variant="body2" color="grey.400">
                        {nextContent.performer?.fullName || nextContent.performer?.shortName || nextContent.performer?.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      label="إلغاء"
                      onClick={cancelAutoplay}
                      variant="outlined"
                      sx={{ color: 'white', borderColor: 'white', px: 2 }}
                    />
                    <Chip
                      icon={<PlayArrow />}
                      label="تشغيل الآن"
                      onClick={playNextNow}
                      color="primary"
                      sx={{ px: 2 }}
                    />
                  </Box>

                  {/* Circular Progress */}
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}>
                    <LinearProgress
                      variant="determinate"
                      value={(countdown / 8) * 100}
                      sx={{ height: 4, bgcolor: 'grey.800', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {content.title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  {content.originalDate && (
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(content.originalDate)}
                    </Typography>
                  )}
                  <Chip
                    icon={<Visibility sx={{ fontSize: 16 }} />}
                    label={`${content.viewCount.toLocaleString()} مشاهدة`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 24 }}
                  />
                </Box>
              </Box>

              {/* Format Switcher */}
              {(content.cloudVideoUrl || content.originalFileUrl) && (content.cloudAudioUrl || content.audioUrl) && (
                <Chip
                  icon={content.type === 'video' ? <Headphones /> : <PlayArrow />}
                  label={content.type === 'video' ? 'استمع للصوت' : 'شاهد الفيديو'}
                  onClick={() => {
                    const currentPlayer = content.type === 'video' ? videoRef.current : audioRef.current
                    const currentTime = currentPlayer ? currentPlayer.currentTime : 0
                    const newType = content.type === 'video' ? 'audio' : 'video'
                    navigate(`/content/${content.id}?type=${newType}&t=${currentTime}`, { replace: true })
                  }}
                  color="primary"
                  variant="filled"
                  sx={{
                    height: 40,
                    borderRadius: 2,
                    px: 1,
                    cursor: 'pointer',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}
                />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Performer Info */}
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
                  {content.performer.fullName || content.performer.shortName || content.performer.name}
                </Typography>
                {content.performer.bio && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {content.performer.bio}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 80 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SkipNext color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  مقترحات لك
                </Typography>
              </Box>
              <Box
                sx={{
                  maxHeight: { lg: 'calc(100vh - 180px)' },
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'divider',
                    borderRadius: '4px',
                    '&:hover': {
                      bgcolor: 'text.secondary',
                    },
                  },
                }}
              >
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
                        {item.performer?.fullName || item.performer?.shortName || item.performer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.viewCount.toLocaleString()} مشاهدة • {formatTimeAgo(item.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Fade >
  )
}
