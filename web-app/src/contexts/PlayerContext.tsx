import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'

interface PlayerContextType {
  currentContent: any
  playing: boolean
  progress: number
  audioRef: React.RefObject<HTMLAudioElement>
  videoRef: React.RefObject<HTMLVideoElement>
  setCurrentContent: (content: any) => void
  setPlaying: (playing: boolean) => void
  setProgress: (progress: number) => void
  togglePlay: () => void
  closePlayer: () => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentContent, setCurrentContent] = useState<any>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Update progress automatically
  useEffect(() => {
    if (!currentContent) return
    
    const mediaElement = currentContent.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return

    // Load the source
    if (currentContent.type === 'video') {
      if (mediaElement.src !== currentContent.originalFileUrl) {
        mediaElement.src = currentContent.originalFileUrl
      }
    } else {
      if (mediaElement.src !== currentContent.audioUrl) {
        mediaElement.src = currentContent.audioUrl
      }
    }

    const handleTimeUpdate = () => {
      if (mediaElement.duration > 0) {
        setProgress((mediaElement.currentTime / mediaElement.duration) * 100)
      }
    }

    const handleEnded = () => {
      setPlaying(false)
    }

    const handlePlay = () => {
      setPlaying(true)
    }

    const handlePause = () => {
      setPlaying(false)
    }

    mediaElement.addEventListener('timeupdate', handleTimeUpdate)
    mediaElement.addEventListener('ended', handleEnded)
    mediaElement.addEventListener('play', handlePlay)
    mediaElement.addEventListener('pause', handlePause)

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate)
      mediaElement.removeEventListener('ended', handleEnded)
      mediaElement.removeEventListener('play', handlePlay)
      mediaElement.removeEventListener('pause', handlePause)
    }
  }, [currentContent])

  const togglePlay = () => {
    const mediaElement = currentContent?.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return

    if (playing) {
      mediaElement.pause()
    } else {
      mediaElement.play().catch(err => console.error('Play error:', err))
    }
  }

  const closePlayer = () => {
    const mediaElement = currentContent?.type === 'video' ? videoRef.current : audioRef.current
    if (mediaElement) {
      mediaElement.pause()
      mediaElement.currentTime = 0
    }
    setCurrentContent(null)
    setPlaying(false)
    setProgress(0)
  }

  return (
    <PlayerContext.Provider
      value={{
        currentContent,
        playing,
        progress,
        audioRef,
        videoRef,
        setCurrentContent,
        setPlaying,
        setProgress,
        togglePlay,
        closePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider')
  }
  return context
}
