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
import { ArrowBack, LocationOn, PlayArrow, Headphones } from '@mui/icons-material'
import api from '../services/api'

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
      const response = await api.get(`/content?performerId=${id}`)
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
      <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        <ArrowBack />
      </IconButton>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar
          src={performer?.imageUrl}
          sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
        />
        <Typography variant="h4" fontWeight="bold">
          {performer?.name}
        </Typography>
        {performer?.location && (
          <Chip
            icon={<LocationOn />}
            label={performer.location}
            sx={{ mt: 1 }}
          />
        )}
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {performer?.bio}
        </Typography>
      </Box>

      <Typography variant="h5" gutterBottom fontWeight="bold">
        المحتوى
      </Typography>

      <Grid container spacing={2}>
        {content.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardActionArea onClick={() => navigate(`/content/${item.id}`)}>
                <CardMedia
                  component="div"
                  sx={{
                    pt: '56.25%',
                    bgcolor: 'grey.300',
                    position: 'relative',
                  }}
                  image={item.thumbnailUrl}
                >
                  <Chip
                    icon={item.type === 'video' ? <PlayArrow /> : <Headphones />}
                    label={item.type === 'video' ? 'فيديو' : 'صوت'}
                    size="small"
                    color={item.type === 'video' ? 'primary' : 'secondary'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </CardMedia>
                <CardContent>
                  <Typography variant="h6" noWrap>
                    {item.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
