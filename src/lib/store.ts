import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Drama, Playlist, Reaction, Comment, User } from "./types"

interface DramaState {
  currentDrama: Drama | null
  playlists: Playlist[]
  reactions: Record<string, Reaction[]>
  comments: Record<string, Comment[]>
  setCurrentDrama: (drama: Drama) => void
  addReaction: (dramaId: string, reaction: Reaction) => void
  addComment: (dramaId: string, comment: Comment) => void
  setPlaylists: (playlists: Playlist[]) => void
  setReactions: (dramaId: string, reactions: Reaction[]) => void
  setComments: (dramaId: string, comments: Comment[]) => void
}

interface UserState {
  user: User | null
  token: string | null
  isConnected: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setConnected: (connected: boolean) => void
  login: (user: User, token: string) => void
  logout: () => void
}

interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  setFullscreen: (fullscreen: boolean) => void
  reset: () => void
}

export const useDramaStore = create<DramaState>()((set) => ({
  currentDrama: null,
  playlists: [],
  reactions: {},
  comments: {},
  setCurrentDrama: (drama) => set({ currentDrama: drama }),
  addReaction: (dramaId, reaction) =>
    set((state) => ({
      reactions: {
        ...state.reactions,
        [dramaId]: [...(state.reactions[dramaId] || []), reaction],
      },
    })),
  addComment: (dramaId, comment) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [dramaId]: [...(state.comments[dramaId] || []), comment],
      },
    })),
  setPlaylists: (playlists) => set({ playlists }),
  setReactions: (dramaId, reactions) =>
    set((state) => ({
      reactions: {
        ...state.reactions,
        [dramaId]: reactions,
      },
    })),
  setComments: (dramaId, comments) =>
    set((state) => ({
      comments: {
        ...state.comments,
        [dramaId]: comments,
      },
    })),
}))

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isConnected: false,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem('auth_token', token)
        } else {
          localStorage.removeItem('auth_token')
        }
        set({ token })
      },
      setConnected: (connected) => set({ isConnected: connected }),
      login: (user, token) => {
        localStorage.setItem('auth_token', token)
        set({ user, token, isConnected: true })
      },
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isConnected: false })
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export const usePlayerStore = create<PlayerState>()((set) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ isMuted: muted }),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  }),
}))
