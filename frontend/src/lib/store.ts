import { create } from "zustand"
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
}

interface UserState {
  user: User | null
  isConnected: boolean
  setUser: (user: User | null) => void
  setConnected: (connected: boolean) => void
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
}))

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  isConnected: false,
  setUser: (user) => set({ user }),
  setConnected: (connected) => set({ isConnected: connected }),
}))

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
}))
