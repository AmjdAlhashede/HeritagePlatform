import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Chip,
  IconButton,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import {
  CloudUpload,
  PlayArrow,
  Edit,
  Delete,
  CheckCircle,
  HourglassEmpty,
  Visibility,
  Publish,
} from '@mui/icons-material'
import api from '../services/api'

interface QueueItem {
  id: string
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl?: string
  duration?: number
  status: 'pending' | 'published'
  performerId?: string
  originalDate?: string
  type: string
}

export default function UploadQueue() {
  const [tab, setTab] = useState(0)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [performers, setPerformers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Edit Dialog
  const [editDialog, setEditDialog] = useState(false)
  const [currentItem, setCurrentItem] = useState<QueueItem | null>(null)
  
  // Preview Dialog
  const [previewDialog, setPreviewDialog] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewType, setPreviewType] = useState<'video' | 'audio'>('video')

  useEffect(() => {
    fetchQueue()
    fetchPerformers()
  }, [])

  const fetchQueue = async () => {
    try {
      const response = await api.get('/upload/queue')
      setQueue(response.data)
    } catch (error) {
      console.error('Error fetching queue:', error)
    }
  }

  const fetchPerformers = async () => {
    try {
      const response = await api.get('/performers')
      setPerformers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching performers:', error)
    }
  }

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append('file', file)

        await api.post('/upload/queue', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            )
            setUploadProgress(percentCompleted)
          },
        })

        // Refresh after each upload
        await fetchQueue()
      } catch (error) {
        cons