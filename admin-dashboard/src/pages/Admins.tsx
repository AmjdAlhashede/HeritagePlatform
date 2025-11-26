import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material'
import { Add, PersonAdd } from '@mui/icons-material'
import api from '../services/api'
import { Admin } from '../types'

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [open, setOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    name: '',
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin')
      setAdmins(response.data)
    } catch (error) {
      console.error('Error fetching admins:', error)
    }
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setNewAdmin({ email: '', password: '', name: '' })
  }

  const handleSave = async () => {
    try {
      await api.post('/admin', newAdmin)
      fetchAdmins()
      handleClose()
    } catch (error) {
      console.error('Error creating admin:', error)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">إدارة المسؤولين</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          إضافة مسؤول
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>تاريخ الإنشاء</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Chip
                    label={admin.isActive ? 'نشط' : 'غير نشط'}
                    color={admin.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(admin.createdAt).toLocaleDateString('ar-SA')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAdd sx={{ mr: 1 }} />
            إضافة مسؤول جديد
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="الاسم"
            value={newAdmin.name}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, name: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="البريد الإلكتروني"
            type="email"
            value={newAdmin.email}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="كلمة المرور"
            type="password"
            value={newAdmin.password}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, password: e.target.value })
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
