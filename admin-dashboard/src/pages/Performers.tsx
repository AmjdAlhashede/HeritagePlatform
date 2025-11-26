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
    shortName: '',
    fullName: '',
    bio: '',
    location: '',
    imageUrl: '',
    birthDate: '',
    deathDate: '',
    joinedAnsarallahDate: '',
    isDeceased: false,
    socialLinks: {},
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
      setCurrentPerformer({ 
        name: '', 
        shortName: '',
        fullName: '',
        bio: '', 
        location: '', 
        imageUrl: '',
        birthDate: '',
        deathDate: '',
        joinedAnsarallahDate: '',
        isDeceased: false,
        socialLinks: {},
      })
      setEditMode(false)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setCurrentPerformer({ 
      name: '', 
      shortName: '',
      fullName: '',
      bio: '', 
      location: '', 
      imageUrl: '',
      birthDate: '',
      deathDate: '',
      joinedAnsarallahDate: '',
      isDeceased: false,
      socialLinks: {},
    })
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
                    {(performer as any).shortName && (
                      <Typography variant="body2" color="primary.main" display="block">
                        {(performer as any).shortName}
                      </Typography>
                    )}
                    {(performer as any).fullName && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {(performer as any).fullName}
                      </Typography>
                    )}
                    {performer.location && (
                      <Chip label={performer.location} size="small" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {performer.bio || 'لا يوجد وصف'}
                </Typography>
                {(performer as any).isDeceased && (
                  <Chip 
                    label="رحمه الله" 
                    size="small" 
                    color="error"
                    sx={{ mt: 1 }}
                  />
                )}
                {(performer as any).joinedAnsarallahDate && (
                  <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                    🎖️ التحق بأنصار الله: {new Date((performer as any).joinedAnsarallahDate).toLocaleDateString('ar-SA')}
                  </Typography>
                )}
                {(performer as any).socialLinks && Object.keys((performer as any).socialLinks).length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                    {(performer as any).socialLinks.twitter && (
                      <Chip 
                        label="𝕏" 
                        size="small" 
                        component="a"
                        href={(performer as any).socialLinks.twitter}
                        target="_blank"
                        clickable
                        sx={{ fontSize: '12px' }}
                      />
                    )}
                    {(performer as any).socialLinks.telegram && (
                      <Chip 
                        label="Telegram" 
                        size="small" 
                        component="a"
                        href={(performer as any).socialLinks.telegram}
                        target="_blank"
                        clickable
                      />
                    )}
                    {(performer as any).socialLinks.youtube && (
                      <Chip 
                        label="YouTube" 
                        size="small" 
                        component="a"
                        href={(performer as any).socialLinks.youtube}
                        target="_blank"
                        clickable
                        color="error"
                      />
                    )}
                    {(performer as any).socialLinks.facebook && (
                      <Chip 
                        label="Facebook" 
                        size="small" 
                        component="a"
                        href={(performer as any).socialLinks.facebook}
                        target="_blank"
                        clickable
                        color="primary"
                      />
                    )}
                    {(performer as any).socialLinks.instagram && (
                      <Chip 
                        label="Instagram" 
                        size="small" 
                        component="a"
                        href={(performer as any).socialLinks.instagram}
                        target="_blank"
                        clickable
                        color="secondary"
                      />
                    )}
                  </Box>
                )}
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
            label="الاسم الجهادي *"
            value={currentPerformer.name}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, name: e.target.value })
            }
            margin="normal"
            required
            placeholder="مثال: أبو علي الحاكم"
            helperText="الاسم الجهادي المشهور (يظهر بشكل أساسي)"
          />
          <TextField
            fullWidth
            label="الاسم المختصر"
            value={currentPerformer.shortName}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, shortName: e.target.value })
            }
            margin="normal"
            placeholder="مثال: علي الحاكم"
            helperText="اسم قصير للعرض السريع"
          />
          <TextField
            fullWidth
            label="الاسم الكامل الحقيقي"
            value={currentPerformer.fullName}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, fullName: e.target.value })
            }
            margin="normal"
            placeholder="مثال: علي محمد أحمد الحاكم"
            helperText="الاسم الحقيقي الكامل (يظهر في التفاصيل)"
          />
          <TextField
            fullWidth
            label="نبذة عن المؤدي"
            value={currentPerformer.bio}
            onChange={(e) =>
              setCurrentPerformer({ ...currentPerformer, bio: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            placeholder="اكتب نبذة مفصلة عن المؤدي وإنجازاته..."
          />
          <TextField
            fullWidth
            label="المحافظة/المدينة"
            value={currentPerformer.location}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                location: e.target.value,
              })
            }
            margin="normal"
            placeholder="مثال: صنعاء، صعدة، الحديدة"
          />
          <TextField
            fullWidth
            label="تاريخ الميلاد"
            type="date"
            value={currentPerformer.birthDate}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                birthDate: e.target.value,
              })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="تاريخ الالتحاق بأنصار الله"
            type="date"
            value={currentPerformer.joinedAnsarallahDate}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                joinedAnsarallahDate: e.target.value,
              })
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>الحالة</InputLabel>
            <Select
              value={currentPerformer.isDeceased ? 'deceased' : 'alive'}
              onChange={(e) =>
                setCurrentPerformer({
                  ...currentPerformer,
                  isDeceased: e.target.value === 'deceased',
                })
              }
              label="الحالة"
            >
              <MenuItem value="alive">على قيد الحياة</MenuItem>
              <MenuItem value="deceased">متوفى (رحمه الله)</MenuItem>
            </Select>
          </FormControl>
          {currentPerformer.isDeceased && (
            <TextField
              fullWidth
              label="تاريخ الوفاة"
              type="date"
              value={currentPerformer.deathDate}
              onChange={(e) =>
                setCurrentPerformer({
                  ...currentPerformer,
                  deathDate: e.target.value,
                })
              }
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          )}

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            روابط التواصل الاجتماعي (اختياري)
          </Typography>
          
          <TextField
            fullWidth
            label="رابط Twitter/X"
            value={currentPerformer.socialLinks?.twitter || ''}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                socialLinks: {
                  ...currentPerformer.socialLinks,
                  twitter: e.target.value,
                },
              })
            }
            margin="normal"
            placeholder="https://twitter.com/username أو https://x.com/username"
          />
          
          <TextField
            fullWidth
            label="رابط Telegram"
            value={currentPerformer.socialLinks?.telegram || ''}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                socialLinks: {
                  ...currentPerformer.socialLinks,
                  telegram: e.target.value,
                },
              })
            }
            margin="normal"
            placeholder="https://t.me/username"
          />
          
          <TextField
            fullWidth
            label="رابط YouTube"
            value={currentPerformer.socialLinks?.youtube || ''}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                socialLinks: {
                  ...currentPerformer.socialLinks,
                  youtube: e.target.value,
                },
              })
            }
            margin="normal"
            placeholder="https://youtube.com/@username"
          />
          
          <TextField
            fullWidth
            label="رابط Facebook"
            value={currentPerformer.socialLinks?.facebook || ''}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                socialLinks: {
                  ...currentPerformer.socialLinks,
                  facebook: e.target.value,
                },
              })
            }
            margin="normal"
            placeholder="https://facebook.com/username"
          />
          
          <TextField
            fullWidth
            label="رابط Instagram"
            value={currentPerformer.socialLinks?.instagram || ''}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                socialLinks: {
                  ...currentPerformer.socialLinks,
                  instagram: e.target.value,
                },
              })
            }
            margin="normal"
            placeholder="https://instagram.com/username"
          />
          <TextField
            fullWidth
            label="رابط الصورة (اختياري)"
            value={currentPerformer.imageUrl}
            onChange={(e) =>
              setCurrentPerformer({
                ...currentPerformer,
                imageUrl: e.target.value,
              })
            }
            margin="normal"
            placeholder="https://example.com/image.jpg"
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
