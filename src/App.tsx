import { Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/app-layout"
import { HomePage } from "./pages/home"
import { WatchPage } from "./pages/watch"
import { PlaylistsPage } from "./pages/playlists"
import { PlaylistDetailPage } from "./pages/playlist-detail"
import { UploadPage } from "./pages/upload"

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/watch" element={<WatchPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </AppLayout>
  )
}

export default App
