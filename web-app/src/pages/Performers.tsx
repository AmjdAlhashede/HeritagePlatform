import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Chip,
  Skeleton,
} from '@mui/material'
import { LocationOn } from '@mui/icons-material'
import api from '../services/api'

export default function Performers() {
  const navigate = useNavigate()
  const [performers, setPerformers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformers()
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        المؤدون
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        تعرف على أفضل المؤدين
      </Typography>

      <Grid container spacing={3}>
        {loading
          ? Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rectangular" height={150} />
              </Grid>
            ))
          : performers.map((performer) => (
              <Grid item xs={12} sm={6} md={4} key={performer.id}>
                <Card
                  sx={{
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/performers/${performer.id}`)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={performer.imageUrl}
                        sx={{
                          width: 120,
                          height: 120,
                          mx: 'auto',
                          mb: 2,
                          border: '4px solid',
                          borderColor: 'primary.main',
                        }}
                      />
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {performer.name}
                      </Typography>
                      {performer.location && (
                        <Chip
                          icon={<LocationOn />}
                          label={performer.location}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: 60,
                        }}
                      >
                        {performer.bio || 'لا يوجد وصف'}
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
