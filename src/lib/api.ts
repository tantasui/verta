import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  connectWallet: async (data: {
    walletAddress: string;
    signature?: string;
    message?: string;
  }) => {
    const response = await api.post('/auth/wallet/connect', data);
    return response.data;
  },
};

// Dramas API
export const dramasAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    sort?: string;
    order?: string;
  }) => {
    const response = await api.get('/dramas', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/dramas/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
    category?: string;
    tags?: string[];
    emotionalTags?: string[];
  }) => {
    const response = await api.post('/dramas', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      category?: string;
      tags?: string[];
      emotionalTags?: string[];
      isPublished?: boolean;
    }
  ) => {
    const response = await api.put(`/dramas/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/dramas/${id}`);
    return response.data;
  },

  like: async (id: string) => {
    const response = await api.post(`/dramas/${id}/like`);
    return response.data;
  },

  getTrending: async (limit = 10) => {
    const response = await api.get('/dramas/trending/list', { params: { limit } });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getUserDramas: async (id: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/users/${id}/dramas`, { params });
    return response.data;
  },

  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  }) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  follow: async (id: string) => {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  },
};

// Playlists API
export const playlistsAPI = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/playlists', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/playlists/${id}`);
    return response.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    thumbnailUrl?: string;
    isPublic?: boolean;
  }) => {
    const response = await api.post('/playlists', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      thumbnailUrl?: string;
      isPublic?: boolean;
    }
  ) => {
    const response = await api.put(`/playlists/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/playlists/${id}`);
    return response.data;
  },

  addDrama: async (id: string, dramaId: string) => {
    const response = await api.post(`/playlists/${id}/items`, { dramaId });
    return response.data;
  },

  removeDrama: async (id: string, dramaId: string) => {
    const response = await api.delete(`/playlists/${id}/items/${dramaId}`);
    return response.data;
  },
};

// Comments API
export const commentsAPI = {
  getForDrama: async (dramaId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/comments/drama/${dramaId}`, { params });
    return response.data;
  },

  create: async (data: {
    dramaId: string;
    content: string;
    parentId?: string;
  }) => {
    const response = await api.post('/comments', data);
    return response.data;
  },

  update: async (id: string, content: string) => {
    const response = await api.put(`/comments/${id}`, { content });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  like: async (id: string) => {
    const response = await api.post(`/comments/${id}/like`);
    return response.data;
  },
};

// Reactions API
export const reactionsAPI = {
  getForDrama: async (dramaId: string) => {
    const response = await api.get(`/reactions/drama/${dramaId}`);
    return response.data;
  },

  getUserReactions: async (dramaId: string) => {
    const response = await api.get(`/reactions/drama/${dramaId}/user`);
    return response.data;
  },

  add: async (data: {
    dramaId: string;
    emotion: string;
    timestamp?: number;
  }) => {
    const response = await api.post('/reactions', data);
    return response.data;
  },

  remove: async (data: { dramaId: string; emotion: string }) => {
    const response = await api.delete('/reactions', { data });
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  video: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('video', file);

    const response = await api.post('/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  thumbnail: async (file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await api.post('/upload/thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  drama: async (
    video: File,
    thumbnail: File | null,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('video', video);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
    }

    const response = await api.post('/upload/drama', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },
};

export default api;
