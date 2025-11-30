import type { Drama, Playlist } from "./types"

export const mockDramas: Drama[] = [
  {
    id: "drama-1",
    title: "The CEO's Secret Love",
    description: "A powerful CEO falls for his assistant in this emotional rollercoaster of corporate romance.",
    thumbnail: "/romantic-drama-poster.png",
    videoUrl: "/vertical-video-placeholder.jpg",
    duration: 480, // 8 minutes
    viewCount: 125000,
    tags: ["romance", "drama", "ceo", "emotional"],
    emotionalMarkers: [
      {
        timestamp: 120,
        emotion: "romantic",
        description: "First romantic tension",
        intensity: 3,
      },
      {
        timestamp: 300,
        emotion: "shocked",
        description: "Secret revealed",
        intensity: 5,
      },
    ],
    createdAt: new Date("2024-01-15"),
    uploadedBy: "user-1",
  },
  {
    id: "drama-2",
    title: "Betrayal at Midnight",
    description: "A thrilling tale of betrayal and revenge that will keep you on the edge of your seat.",
    thumbnail: "/business-drama-poster.png",
    videoUrl: "/vertical-video-placeholder.jpg",
    duration: 360, // 6 minutes
    viewCount: 89000,
    tags: ["thriller", "betrayal", "suspense", "dark"],
    emotionalMarkers: [
      {
        timestamp: 60,
        emotion: "suspenseful",
        description: "Mystery begins",
        intensity: 4,
      },
      {
        timestamp: 240,
        emotion: "shocked",
        description: "Plot twist revealed",
        intensity: 5,
      },
    ],
    createdAt: new Date("2024-01-10"),
    uploadedBy: "user-2",
  },
  {
    id: "drama-3",
    title: "Love in the Rain",
    description: "A heartwarming story of unexpected love found during a stormy night.",
    thumbnail: "/romantic-drama-poster.png",
    videoUrl: "/vertical-video-placeholder.jpg",
    duration: 420, // 7 minutes
    viewCount: 156000,
    tags: ["romance", "heartwarming", "rain", "sweet"],
    emotionalMarkers: [
      {
        timestamp: 180,
        emotion: "romantic",
        description: "First meeting in the rain",
        intensity: 4,
      },
      {
        timestamp: 350,
        emotion: "happy",
        description: "Happy ending",
        intensity: 5,
      },
    ],
    createdAt: new Date("2024-01-20"),
    uploadedBy: "user-3",
  },
]

export const mockPlaylists: Playlist[] = [
  {
    id: "playlist-1",
    title: "Trending Dramas",
    description: "The most popular short dramas everyone is talking about",
    coverImage: "/trending-playlist-cover.jpg",
    category: "trending",
    dramaCount: 12,
    totalDuration: 96, // minutes
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: "playlist-2",
    title: "Emotional Rollercoasters",
    description: "Prepare for tears, laughter, and everything in between",
    coverImage: "/emotional-playlist-cover.jpg",
    category: "emotional-rollercoaster",
    dramaCount: 8,
    totalDuration: 64,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-22"),
  },
  {
    id: "playlist-3",
    title: "Romance Collection",
    description: "Sweet and passionate love stories to warm your heart",
    coverImage: "/romance-playlist-cover.jpg",
    category: "romance",
    dramaCount: 15,
    totalDuration: 120,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-24"),
  },
]
