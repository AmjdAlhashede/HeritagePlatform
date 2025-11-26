import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Avatar,
  Skeleton,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Fade,
  Grow,
  Zoom,
} from '@mui/material'
import { PlayArrow, Headphones, Visibility, GetApp, AccessTime, Sort, TrendingUp } from '@mui/icons-material'
import api from '../services/api'

function formatTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return 'الآن'
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
  if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`
  if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 604800)} أسبوع`
  return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function Home() {
  const navigate = useNavigate()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(24)

  useEffect(() => {
    fetchContent()
  }, [])

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(24)
  }, [filter, sortBy])

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        setVisibleCount(prev => prev + 24)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchContent = async () => {
    try {
      const response = await api.get('/content?limit=1000')
      const rawContent = response.data.data || []

      const expandedContent: any[] = []
      rawContent.forEach((item: any) => {
        // Check for video
        const hasVideo = item.cloudVideoUrl || item.originalFileUrl || item.type === 'video'
        // Check for audio
        const hasAudio = item.cloudAudioUrl || item.audioUrl || item.type === 'audio'

        let added = false

        if (hasVideo) {
          expandedContent.push({ ...item, type: 'video', displayId: `${item.id}-video` })
          added = true
        }

        if (hasAudio) {
          expandedContent.push({ ...item, type: 'audio', displayId: `${item.id}-audio` })
          added = true
        }

        // Fallback: if neither detected specifically but item exists, add it as is
        if (!added) {
          expandedContent.push({ ...item, displayId: item.id })
        }
      })

      setContent(expandedContent)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate counts
  const counts = {
    all: content.length,
    video: content.filter(i => i.type === 'video').length,
    audio: content.filter(i => i.type === 'audio').length
  }

  const filteredAndSortedContent = content
    .filter(item => {
      if (filter === 'all') return true
      return item.type === filter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'popular':
          return b.viewCount - a.viewCount
        case 'trending':
          return (b.viewCount + b.downloadCount * 2) - (a.viewCount + a.downloadCount * 2)
        default:
          return 0
      }
    })

  // Get only visible items
  const visibleContent = filteredAndSortedContent.slice(0, visibleCount)

  const ContentCard = ({ item, index }) => (
    <Grow in timeout={300 + (index % 24) * 50}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'none',
          bgcolor: 'transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            '& .thumbnail': {
              transform: 'scale(1.05)',
            },
            '& .play-overlay': {
              opacity: 1,
            },
          },
        }}
      >
        <CardActionArea onClick={() => navigate(`/content/${item.id}?type=${item.type}`)}>
          <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
            <CardMedia
              component="img"
              image={item.thumbnailUrl}
              alt={item.title}
              className="thumbnail"
              sx={{
                aspectRatio: '16/9',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                bgcolor: 'grey.300',
              }}
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/640x360/1a1a1a/ffffff?text=No+Image';
              }}
            />

            {/* Play Overlay */}
            <Box
              className="play-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(0,0,0,0.4)',
                opacity: 0,
                transition: 'opacity 0.3s',
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: item.type === 'video' ? 'error.main' : 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {item.type === 'video' ? (
                  <PlayArrow sx={{ fontSize: 32, color: 'white' }} />
                ) : (
                  <Headphones sx={{ fontSize: 32, color: 'white' }} />
                )}
              </Box>
            </Box>

            {/* Duration Badge */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.85)',
                color: 'white',
                px: 0.75,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backdropFilter: 'blur(4px)',
              }}
            >
              {formatDuration(item.duration)}
            </Box>

            {/* Type Badge */}
            <Chip
              icon={item.type === 'video' ? <PlayArrow /> : <Headphones />}
              label={item.type === 'video' ? 'فيديو' : 'صوت'}
              size="small"
              color={item.type === 'video' ? 'error' : 'secondary'}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontWeight: 'bold',
                boxShadow: 2,
              }}
            />
          </Box>
          <CardContent sx={{ px: 0, pt: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Avatar
                src={item.performer?.imageUrl}
                sx={{ width: 36, height: 36, mt: 0.5 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4,
                    mb: 0.5,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {item.performer?.fullName || item.performer?.shortName || item.performer?.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {item.viewCount.toLocaleString()} مشاهدة
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(item.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grow>
  )

  return (
    <Fade in timeout={500}>
      <Box>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          pb: 1,
        }}>
          <Tabs
            value={filter}
            onChange={(e, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
              },
            }}
          >
            <Tab label={`الكل (${counts.all})`} value="all" />
            <Tab label={`فيديو (${counts.video})`} value="video" icon={<PlayArrow />} iconPosition="start" />
            <Tab label={`صوت (${counts.audio})`} value="audio" icon={<Headphones />} iconPosition="start" />
          </Tabs>
          <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              startAdornment={<Sort sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />}
              sx={{
                borderRadius: 10,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="newest">الأحدث</MenuItem>
              <MenuItem value="popular">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility fontSize="small" />
                  الأكثر مشاهدة
                </Box>
              </MenuItem>
              <MenuItem value="trending">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp fontSize="small" />
                  الرائج
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={2}>
          {loading
            ? Array.from(new Array(8)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Skeleton variant="rectangular" sx={{ aspectRatio: '16/9', borderRadius: 2 }} />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="80%" />
                    <Skeleton width="60%" />
                  </Box>
                </Box>
              </Grid>
            ))
            : visibleContent.length === 0
              ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      لا يوجد محتوى حالياً
                    </Typography>
                  </Box>
                </Grid>
              )
              : visibleContent.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.displayId || item.id}>
                  <ContentCard item={item} index={index} />
                </Grid>
              ))}
        </Grid>
      </Box>
    </Fade>
  )
}
