import { useState, useEffect } from 'react'
import { Typography, Grid, Paper, Box, LinearProgress } from '@mui/material'
import { People, VideoLibrary, TrendingUp, Download } from '@mui/icons-material'
import api from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    performers: 0,
    content: 0,
    views: 0,
    downloads: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [performersRes, contentRes] = await Promise.all([
        api.get('/performers'),
        api.get('/content'),
      ])

      const totalViews = contentRes.data.data.reduce(
        (sum, item) => sum + item.viewCount,
        0
      )
      const totalDownloads = contentRes.data.data.reduce(
        (sum, item) => sum + item.downloadCount,
        0
      )

      setStats({
        performers: performersRes.data.meta.total,
        content: contentRes.data.meta.total,
        views: totalViews,
        downloads: totalDownloads,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.3s',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6,
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: `${color}.50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ fontSize: 48, color: `${color}.main` }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight="bold">
          {loading ? '...' : value.toLocaleString()}
        </Typography>
      </Box>
    </Paper>
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        مرحباً بك في لوحة التحكم
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        نظرة عامة على إحصائيات المنصة
      </Typography>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={People}
            label="إجمالي المؤدين"
            value={stats.performers}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={VideoLibrary}
            label="إجمالي المحتوى"
            value={stats.content}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingUp}
            label="إجمالي المشاهدات"
            value={stats.views}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Download}
            label="إجمالي التنزيلات"
            value={stats.downloads}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              مرحباً بك في Heritage Platform
            </Typography>
            <Typography variant="body2" color="text.secondary">
              منصة شاملة لإدارة المحتوى التراثي. يمكنك من هنا إدارة المؤدين، رفع المحتوى، ومتابعة الإحصائيات.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
