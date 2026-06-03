import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0812, #1a0e14, #12101e)' }}>
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4 filter drop-shadow-[0_0_20px_rgba(229,57,53,0.3)]">🐺</div>
          <p className="text-vn-gold-400/60 text-lg font-medium tracking-wider">Đang tải...</p>
          <div className="mt-3 w-32 h-[2px] mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,179,0,0.4), transparent)' }} />
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route path="/" element={
          <ProtectedRoute><LobbyPage /></ProtectedRoute>
        } />
        <Route path="/game/:gameId" element={
          <ProtectedRoute><GamePage /></ProtectedRoute>
        } />
        <Route path="/profile/:username?" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
