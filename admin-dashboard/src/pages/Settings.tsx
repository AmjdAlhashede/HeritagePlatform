import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
} from '@mui/material'
import { Save, Sync, CheckCircle } from '@mui/icons-material'
import api from '../services/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Neon Settings
  const [neonSettings, setNeonSettings] = useState({
    databaseUrl: '',
  })

  // R2 Settings
  const [r2Settings, setR2Settings] = useState({
    endpoint: '',
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: '',
  })

  // Sync Status
  const [syncStatus, setSyncStatus] = useState({
    neon: { performers: 0, content: 0 },
    r2: { performers: 0, content: 0 },
    synced: false,
  })

  useEffect(() => {
    fetchSettings()
    fetchSyncStatus()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      if (response.data.neon) {
        setNeonSettings(response.data.neon)
      }
      if (response.data.r2) {
        setR2Settings(response.data.r2)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const response = await api.get('/sync/status')
      setSyncStatus(response.data)
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }

  const handleSaveNeon = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/admin/settings/neon', neonSettings)
      setMessage({ type: 'success', text: 'تم حفظ إعدادات Neon بنجاح' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل الحفظ' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveR2 = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await api.post('/admin/settings/r2', r2Settings)
      setMessage({ type: 'success', text: 'تم حفظ إعدادات R2 بنجاح' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل الحفظ' })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncFromR2 = async () => {
    if (!window.confirm('هل أنت متأكد من استرجاع كل البيانات من R2؟ هذا سيستبدل البيانات الحالية.')) {
      return
    }

    setSyncing(true)
    setMessage(null)
    try {
      const response = await api.post('/sync/from-r2')
      setMessage({
        type: 'success',
        text: `تم استرجاع ${response.data.performers} مؤدي و ${response.data.content} محتوى من R2`,
      })
      await fetchSyncStatus()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل الاسترجاع' })
    } finally {
      setSyncing(false)
    }
  }

  const handleRebuildMetadata = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة بناء metadata في R2؟')) {
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const response = await api.post('/sync/rebuild-metadata')
      setMessage({
        type: 'success',
        text: `تم إعادة بناء metadata لـ ${response.data.performers} مؤدي و ${response.data.content} محتوى`,
      })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'فشل إعادة البناء' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        الإعدادات
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label="قاعدة البيانات (Neon)" />
          <Tab label="التخزين السحابي (R2)" />
          <Tab label="المزامنة والاسترجاع" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            إعدادات Neon PostgreSQL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            يمكنك تغيير قاعدة البيانات في أي وقت. البيانات محفوظة في R2.
          </Typography>

          <TextField
            fullWidth
            label="Database URL"
            value={neonSettings.databaseUrl}
            onChange={(e) => setNeonSettings({ ...neonSettings, databaseUrl: e.target.value })}
            placeholder="postgresql://user:pass@host:5432/dbname?sslmode=require"
            margin="normal"
            helperText="Connection string من Neon أو أي PostgreSQL"
          />

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveNeon}
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              💡 بعد تغيير قاعدة البيانات، استخدم "المزامنة والاسترجاع" لاسترجاع البيانات من R2
            </Typography>
          </Alert>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            إعدادات Cloudflare R2
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            R2 هو المصدر الأساسي لكل البيانات والملفات.
          </Typography>

          <TextField
            fullWidth
            label="R2 Endpoint"
            value={r2Settings.endpoint}
            onChange={(e) => setR2Settings({ ...r2Settings, endpoint: e.target.value })}
            placeholder="https://ACCOUNT_ID.r2.cloudflarestorage.com"
            margin="normal"
          />

          <TextField
            fullWidth
            label="Account ID"
            value={r2Settings.accountId}
            onChange={(e) => setR2Settings({ ...r2Settings, accountId: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Access Key ID"
            value={r2Settings.accessKeyId}
            onChange={(e) => setR2Settings({ ...r2Settings, accessKeyId: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Secret Access Key"
            type="password"
            value={r2Settings.secretAccessKey}
            onChange={(e) => setR2Settings({ ...r2Settings, secretAccessKey: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Bucket Name"
            value={r2Settings.bucketName}
            onChange={(e) => setR2Settings({ ...r2Settings, bucketName: e.target.value })}
            placeholder="heritage"
            margin="normal"
          />

          <TextField
            fullWidth
            label="Public URL (اختياري)"
            value={r2Settings.publicUrl}
            onChange={(e) => setR2Settings({ ...r2Settings, publicUrl: e.target.value })}
            placeholder="https://media.yourdomain.com"
            margin="normal"
            helperText="إذا ربطت Custom Domain"
          />

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveR2}
              disabled={loading}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            المزامنة والاسترجاع
          </Typography>

          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              حالة البيانات
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {syncStatus.neon.performers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  مؤدين في Neon
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {syncStatus.neon.content}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  محتوى في Neon
                </Typography>
              </Box>
            </Box>

            {syncStatus.synced ? (
              <Alert severity="success" icon={<CheckCircle />}>
                البيانات متزامنة مع R2
              </Alert>
            ) : (
              <Alert severity="warning">
                البيانات غير متزامنة - استخدم "استرجاع من R2"
              </Alert>
            )}
          </Card>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
              onClick={handleSyncFromR2}
              disabled={syncing}
              color="primary"
            >
              {syncing ? 'جاري الاسترجاع...' : 'استرجاع كل البيانات من R2'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              onClick={handleRebuildMetadata}
              disabled={loading}
            >
              {loading ? 'جاري إعادة البناء...' : 'إعادة بناء Metadata في R2'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              متى تستخدم "استرجاع من R2"؟
            </Typography>
            <Typography variant="body2" component="div">
              • عند تغيير قاعدة البيانات<br />
              • عند فقدان البيانات من Neon<br />
              • عند الانتقال لخادم جديد<br />
              • لمزامنة البيانات بعد تعديلات يدوية
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ⚠️ الاسترجاع سيستبدل كل البيانات الحالية في Neon بالبيانات من R2
            </Typography>
          </Alert>
        </TabPanel>
      </Card>
    </Box>
  )
}
