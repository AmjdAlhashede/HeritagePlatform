import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  InputBase,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  alpha,
  styled,
} from '@mui/material'
import {
  Home,
  People,
  Search as SearchIcon,
  MusicNote,
} from '@mui/icons-material'


const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}))

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { audioRef, videoRef } = usePlayer()

  const getBottomNavValue = () => {
    if (location.pathname === '/') return 0
    if (location.pathname.startsWith('/performers')) return 1
    if (location.pathname.startsWith('/search')) return 2
    return 0
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <MusicNote sx={{ mr: 1, color: 'error.main', fontSize: 32 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: 'none', sm: 'block' },
              cursor: 'pointer',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #f50057 30%, #ff4081 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => navigate('/')}
          >
            منصة الزوامل
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="بحث..."
              inputProps={{ 'aria-label': 'search' }}
              onFocus={() => navigate('/search')}
            />
          </Search>

        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4, mb: 8 }}>
        <Outlet />
      </Container>

      <audio ref={audioRef} style={{ display: 'none' }} />
      <video ref={videoRef} style={{ display: 'none' }} />

      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
        elevation={3}
      >
        <BottomNavigation
          value={getBottomNavValue()}
          onChange={(_, newValue) => {
            if (newValue === 0) navigate('/')
            if (newValue === 1) navigate('/performers')
            if (newValue === 2) navigate('/search')
          }}
        >
          <BottomNavigationAction label="الرئيسية" icon={<Home />} />
          <BottomNavigationAction label="المؤدون" icon={<People />} />
          <BottomNavigationAction label="بحث" icon={<SearchIcon />} />
        </BottomNavigation>
      </Paper>
    </Box>
  )
}
