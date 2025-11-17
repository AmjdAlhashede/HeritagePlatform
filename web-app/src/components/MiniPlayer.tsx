import { Box, IconButton, Typography, Avatar, Slider, Paper, Fade } from '@mui/material'
import { PlayArrow, Pause, Close, SkipNext, SkipPrevious } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface MiniPlayerProps {
  content: any
  playing: boolean
  progress: number
  onTogglePlay: () => void
  onClose: () => void
  onProgressChange: (value: number) => void
}

export default function MiniPlayer({
  content,
  playing,
  progress,
  onTogglePlay,
  onClose,
  onProgressChange,
}: MiniPlayerProps) {
  const navigate = useNavigate()

  if (!content) return null

  return (
    <Fade in>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Progress Bar */}
        <Slider
          value={progress}
          onChange={(e, val) => onProgressChange(val as number)}
          sx={{
            position: 'absolute',
            top: -6,
            left: 0,
            right: 0,
            height: 4,
            padding: 0,
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              transition: 'all 0.2s',
              '&:hover': {
                width: 16,
                height: 16,
              },
            },
            '& .MuiSlider-rail': {
              opacity: 0.3,
            },
          }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            cursor: 'pointer',
          }}
        >
          {/* Thumbnail */}
          <Box
            onClick={() => navigate(`/content/${content.id}`)}
            sx={{
              position: 'relative',
              width: 80,
              height: 60,
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>

          {/* Content Info */}
          <Box
            sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => navigate(`/content/${content.id}`)}
          >
            <Typography
              variant="subtitle2"
              fontWeight="600"
              noWrap
              sx={{ mb: 0.5 }}
            >
              {content.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {content.performer?.name}
            </Typography>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={onTogglePlay}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>

            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                '&:hover': {
                  color: 'error.main',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s',
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  )
}
