import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  IconButton,
  Skeleton,
} from '@mui/material'
import { LocationOn, PlayArrow, Headphones, Visibility } from '@mui/icons-material'
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

export default function PerformerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [performer, setPerformer] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformer()
    fetchContent()
  }, [id])

  const fetchPerformer = async () => {
    try {
      const response = await api.get(`/performers/${id}`)
      setPerformer(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchContent = async () => {
    try {
      const response = await api.get(`/content?performerId=${id}&limit=1000`)
      setContent(response.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="circular" width={120} height={120} />
        <Skeleton width="60%" sx={{ mt: 2 }} />
        <Skeleton width="40%" />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar
          src={performer?.imageUrl}
          sx={{
            width: 150,
            height: 150,
            mx: 'auto',
            mb: 2,
            border: '4px solid',
            borderColor: 'primary.main',
            boxShadow: 3,
          }}
        />
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
          {performer?.fullName || performer?.shortName || performer?.name}
        </Typography>
        {performer?.location && (
          <Chip
            icon={<LocationOn />}
            label={performer.location}
            color="primary"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        )}
        {performer?.bio && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            {performer.bio}
          </Typography>
        )}
      </Box>

      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
        المحتوى ({content.length})
      </Typography>

      {content.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            لا يوجد محتوى لهذا المؤدي حالياً
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {content.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(`/content/${item.id}`)}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={item.thumbnailUrl}
                      alt={item.title}
                      sx={{
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/640x360/1a1a1a/ffffff?text=No+Image';
                      }}
                    />
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
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight="600"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: 48,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Visibility sx={{ fontSize: 14 }} />
                        {item.viewCount.toLocaleString()}
                      </Typography>
                      {item.originalDate && (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(item.originalDate)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
