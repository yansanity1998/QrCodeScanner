import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import QrCodeScanner from './QrCodeScanner/QrCodeScanner'
import Login from './QrCodeScanner/Login'
import Register from './QrCodeScanner/Register'
import HistoryPage from './QrCodeScanner/HistoryPage'
import ProfilePage from './QrCodeScanner/ProfilePage'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <Routes>
          <Route path="/login" element={
            !session ? (
              <Login
                onSwitchToRegister={() => window.location.href = '/register'}
                onLogin={() => { }} // Auth state change will handle redirect
              />
            ) : <Navigate to="/scanner" replace />
          } />
          <Route path="/register" element={
            <Register
              onSwitchToLogin={() => window.location.href = '/login'}
              onRegister={() => { }}
            />
          } />
          <Route path="/scanner" element={
            session ? (
              <QrCodeScanner onLogout={handleLogout} />
            ) : <Navigate to="/login" replace />
          } />
          <Route path="/profile" element={
            session ? (
              <ProfilePage />
            ) : <Navigate to="/login" replace />
          } />
          <Route path="/history" element={
            session ? (
              <HistoryPage />
            ) : <Navigate to="/login" replace />
          } />
          <Route path="/" element={<Navigate to={session ? "/scanner" : "/login"} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
