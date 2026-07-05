import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Notifiche from './pages/Notifiche'
import Termini from './pages/Termini'
import ProtectedRoute from './components/ProtectedRoute'

// Redirect automatico alla dashboard se l'utente è già loggato
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F6ECC8' }}>
      <div className="w-10 h-10 rounded-full border-[3px] border-t-transparent animate-spin"
        style={{ borderColor: '#E8A859', borderTopColor: 'transparent' }} />
    </div>
  )
  if (user) return <Navigate to="/dashboard" replace />
  return <Home />
}

export default function App() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: true })

    const listener = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('it.bertie.app://auth/callback')) return
      try {
        if (url.includes('access_token=')) {
          const fragment = url.includes('#') ? url.split('#')[1] : url.split('?')[1]
          const params = new URLSearchParams(fragment)
          await supabase.auth.setSession({
            access_token: params.get('access_token'),
            refresh_token: params.get('refresh_token'),
          })
        } else {
          await supabase.auth.exchangeCodeForSession(url)
        }
      } finally {
        Browser.close()
      }
    })

    return () => { listener.then(l => l.remove()) }
  }, [])

  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/termini" element={<Termini />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/registrati" element={<Auth />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/notifiche" element={
          <ProtectedRoute><Notifiche /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}
