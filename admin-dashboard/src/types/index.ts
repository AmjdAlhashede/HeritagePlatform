export interface ContentItem {
  id: string
  title: string
  description?: string
  type: 'video' | 'audio'
  viewCount: number
  downloadCount: number
  performerId: string
  thumbnailUrl?: string
  duration?: number
  isProcessed: boolean
  createdAt: string
  performer?: Performer
}

export interface Performer {
  id: string
  name: string
  bio?: string
  imageUrl?: string
  contentCount?: number
  totalViews?: number
  totalDownloads?: number
}

export interface Admin {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
}
