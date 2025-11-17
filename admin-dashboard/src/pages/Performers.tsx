import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { Add, Edit, Delete, Person } from '@mui/icons-material'
import api from '../services/api'

interface Performer {
  id: string
  name: string
  bio: string
  location: string
  imageUrl: string
  createdAt: string
}

export default function Performers() {
  const [performers, setPerformers] = useState<Performer[]>([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentPerformer, setCurrentPerformer] = useState<any>({
    name: '',
    bio: '',
    location: '',
    imageUrl: '',
  })

  useEffect(() => {
    fetchPerformers()
  }, [])

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data)
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const handleOpen = (performer: Performer | null = null) => {
    if (performer) {
      setCurrentPerformer(performer)
      setEditMode(true)
    } else {
      setCurrentPerformer({ name: '', bio: '', location: '', imageUrl: '' })
      setEditMode(false)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setCurrentPerformer({ name: '', bio: '', location: '', imageUrl: '' })
  }

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/performers/${currentPerformer.id}`, currentPerformer)
      } else {
        await api.post('/performers', currentPerformer)
      }
      fetchPerformers()
      handleClose()
    } catch (error) {
      console.error('Error saving performer:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المؤدي؟')) {
      try {
        await api.delete(`/performers/${id}`)
        fetchPerformers()
      } catch (error) {
        console.error('Error deleting performer:', error)
      }
    }
  }

  const [sortBy, setSortBy] = useState('newest')

  const sortedPerformers = [...performers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'name':
        return a.name.localeCompare(b.name, 'ar')
      default:
        return 0
    }
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">إدارة المؤدين</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>الترتيب</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="الترتيب"
            >
              <MenuItem value="newest">الأحدث</MenuItem>
              <MenuItem value="oldest">الأقدم</MenuItem>
              <MenuItem value="name">الاسم (أ-ي)</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            إضافة مؤدي
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {sortedPerformers.map((performer) => (
          <Grid item xs={12} sm={6} md={4} key={performer.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={performer.imageUrl}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{performer.name}</Typography>
                    {performer.location && (
                      <Chip label={performer.location} size="small" />
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {performer.bio || 'لا يوجد وصف'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpen(performer)}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(performer.id)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'تعديل مؤدي' : 'إضافة مؤدي جديد'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="الاسم"
            value={currentPerformer.name}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, name: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="الوصف"
            value={currentPerformer.bio}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, bio: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="الموقع"
            value={currentPerformer.location}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                location: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="رابط الصورة"
            value={currentPerformer.imageUrl}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                imageUrl: e.target.value,
              })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleSave} variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
