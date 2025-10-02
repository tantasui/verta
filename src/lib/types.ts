export interface Drama {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  duration: number // in seconds
  viewCount: number
  tags: string[]
  emotionalMarkers: EmotionalMarker[]
  createdAt: Date
  uploadedBy: string
}

export interface EmotionalMarker {
  timestamp: number // in seconds
  emotion: EmotionType
  description: string
  intensity: number // 1-5 scale
}

export type EmotionType = "happy" | "sad" | "shocked" | "angry" | "romantic" | "suspenseful" | "funny"

export interface Playlist {
  id: string
  title: string
  description: string
  coverImage?: string
  category: PlaylistCategory
  dramaCount: number
  totalDuration: number // in minutes
  createdAt: Date
  updatedAt: Date
}

export type PlaylistCategory =
  | "trending"
  | "emotional-rollercoaster"
  | "romance"
  | "thriller"
  | "sad-endings"
  | "happy-endings"

export interface Reaction {
  id: string
  userId: string
  dramaId: string
  emotion: EmotionType
  timestamp: number // when in the video the reaction occurred
  createdAt: Date
}

export interface Comment {
  id: string
  userId: string
  dramaId: string
  content: string
  timestamp?: number // optional timestamp for time-based comments
  createdAt: Date
  likes: number
  replies?: Comment[]
}

export interface User {
  id: string
  address: string // wallet address
  username?: string
  avatar?: string
  joinedAt: Date
  totalUploads: number
  totalViews: number
  favoriteGenres: string[]
}

export interface UploadData {
  title: string
  description: string
  file: File | null
  thumbnail: File | null
  tags: string[]
  emotionalMarkers: EmotionalMarker[]
}

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number
  connect: () => Promise<void>
  disconnect: () => void
}
