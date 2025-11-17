import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  TextField,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  InputAdornment,
} from '@mui/material'
import { Search as SearchIcon, PlayArrow, Headphones } from '@mui/icons-material'
import api from '../services/api'

export default function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery)
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    try {
      const response = await api.get(`/content?search=${searchQuery}`)
      setResults(response.data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        بحث
      </Typography>

      <TextField
        fullWidth
        placeholder="ابحث عن محتوى أو مؤدي..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        autoFocus
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {query.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            ابحث عن المحتوى المفضل لديك
          </Typography>
        </Box>
      ) : results.length === 0 && !searching ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            لا توجد نتائج
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {results.map((item) => (
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
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.performer?.name}
                    </Typography>
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
