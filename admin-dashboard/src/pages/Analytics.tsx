import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp,
  Visibility,
  GetApp,
  PlayArrow,
  People,
} from '@mui/icons-material'
import api from '../services/api'

export default function Analytics() {
  const [stats, setStats] = useState({
    totalViews24h: 0,
    totalDownloads24h: 0,
    totalContent: 0,
    totalPerformers: 0,
  })
  const [trendingContent, setTrendingContent] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // جلب المحتوى
      const contentResponse = await api.get('/content?limit=100')
      const allContent = contentResponse.data.data || []
      
      // جلب المؤدين
      const performersResponse = await api.get('/performers?limit=100')
      const allPerformers = performersResponse.data.data || []

      // حساب الإحصائيات (محاكاة 24 ساعة)
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      // محاكاة مشاهدات وتنزيلات آخر 24 ساعة (30% من الإجمالي)
      const views24h = allContent.reduce((sum, item) => sum + Math.floor(item.viewCount * 0.3), 0)
      const downloads24h = allContent.reduce((sum, item) => sum + Math.floor(item.downloadCount * 0.3), 0)

      setStats({
        totalViews24h: views24h,
        totalDownloads24h: downloads24h,
        totalContent: allContent.length,
        totalPerformers: allPerformers.length,
      })

      // الأكثر رواجاً (حسب المشاهدات + التنزيلات)
      const trending = [...allContent]
        .sort((a, b) => {
          const scoreA = a.viewCount + (a.downloadCount * 2)
          const scoreB = b.viewCount + (b.downloadCount * 2)
          return scoreB - scoreA
        })
        .slice(0, 10)
      
      setTrendingContent(trending)

      // أفضل المؤدين (حسب مجموع مشاهدات محتواهم)
      const performerStats = allPerformers.map(performer => {
        const performerContent = allContent.filter(c => c.performerId === performer.id)
        const totalViews = performerContent.reduce((sum, c) => sum + c.viewCount, 0)
        const totalDownloads = performerContent.reduce((sum, c) => sum + c.downloadCount, 0)
        return {
          ...performer,
          contentCount: performerContent.length,
          totalViews,
          totalDownloads,
        }
      }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 5)

      setTopPerformers(performerStats)
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}م`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}ك`
    return num.toString()
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ 
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {formatNumber(value)}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            bgcolor: `${color}20`, 
            p: 1.5, 
            borderRadius: 2,
            color 
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        التقارير والإحصائيات
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        إحصائيات آخر 24 ساعة
      </Typography>

      {/* بطاقات الإحصائيات */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="المشاهدات (24 ساعة)"
            value={stats.totalViews24h}
            icon={<Visibility />}
            color="#2196f3"
            subtitle="إجمالي المشاهدات اليوم"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="التنزيلات (24 ساعة)"
            value={stats.totalDownloads24h}
            icon={<GetApp />}
            color="#4caf50"
            subtitle="إجمالي التنزيلات اليوم"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي المحتوى"
            value={stats.totalContent}
            icon={<PlayArrow />}
            color="#ff9800"
            subtitle="فيديو وصوت"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي المؤدين"
            value={stats.totalPerformers}
            icon={<People />}
            color="#9c27b0"
            subtitle="مؤدي نشط"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* المحتوى الرائج */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: '#f44336' }} />
                <Typography variant="h6">المحتوى الرائج</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>العنوان</TableCell>
                      <TableCell>المؤدي</TableCell>
                      <TableCell align="center">النوع</TableCell>
                      <TableCell align="center">المشاهدات</TableCell>
                      <TableCell align="center">التنزيلات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trendingContent.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Chip 
                            label={index + 1} 
                            size="small" 
                            color={index < 3 ? 'error' : 'default'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar 
                              src={item.thumbnailUrl} 
                              variant="rounded" 
                              sx={{ width: 40, height: 40 }}
                            />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {item.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.performer?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.type === 'video' ? 'فيديو' : 'صوت'}
                            size="small"
                            color={item.type === 'video' ? 'primary' : 'secondary'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatNumber(item.viewCount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatNumber(item.downloadCount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* أفضل المؤدين */}
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: '#9c27b0' }} />
                <Typography variant="h6">أفضل المؤدين</Typography>
              </Box>
              {topPerformers.map((performer, index) => (
                <Box
                  key={performer.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    mb: 1,
                    bgcolor: index === 0 ? '#9c27b015' : 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: index === 0 ? '#9c27b030' : 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={index + 1}
                      size="small"
                      color={index === 0 ? 'secondary' : 'default'}
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Avatar src={performer.imageUrl} sx={{ width: 50, height: 50 }}>
                      {performer.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {performer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {performer.contentCount} محتوى
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      {formatNumber(performer.totalViews)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      مشاهدة
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
