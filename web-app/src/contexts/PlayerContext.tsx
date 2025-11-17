import { createContext, useContext, useState, useRef, ReactNode } from 'react'

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

  const togglePlay = () => {
    const mediaElement = currentContent?.type === 'video' ? videoRef.current : audioRef.current
    if (!mediaElement) return

    if (playing) {
      mediaElement.pause()
    } else {
      mediaElement.play()
    }
    setPlaying(!playing)
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
