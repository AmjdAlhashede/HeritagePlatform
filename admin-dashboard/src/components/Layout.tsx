import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  VideoLibrary,
  Upload,
  Analytics,
  AdminPanelSettings,
  Logout,
} from '@mui/icons-material'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

const drawerWidth = 240

const menuItems = [
  { text: 'لوحة التحكم', icon: Dashboard, path: '/' },
  { text: 'المؤدون', icon: People, path: '/performers' },
  { text: 'المحتوى', icon: VideoLibrary, path: '/content' },
  { text: 'رفع ونشر', icon: Upload, path: '/upload' },
  { text: 'التحليلات', icon: Analytics, path: '/analytics' },
  { text: 'المسؤولون', icon: AdminPanelSettings, path: '/admins' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, logout } = useAuthStore()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Heritage Platform
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                selected={isActive}
              >
                <ListItemIcon>
                  <Icon color={isActive ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          mr: { sm: `${drawerWidth}px` } 
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ ml: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            مرحباً، {admin?.name || 'المسؤول'}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` } 
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
