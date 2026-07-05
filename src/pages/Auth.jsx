import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { useAuth } from '../lib/auth'

const G = {
  gold:    '#E8A859',
  cream:   '#F6ECC8',
  cream50: '#FBF6E2',
  cream200:'#EFE0A8',
  ink:     '#2A2C2C',
  ink500:  '#6B6E6E',
  error:   '#B04040',
  errorBg: 'rgba(176,64,64,0.10)',
}

// Icona Google SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.7C34.2 33.6 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.6 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3 0 5.7 1.1 7.8 2.9l6-6C34.6 6.5 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/>
      <path d="M24 44c5.5 0 10.5-2 14.2-5.3l-6.6-5.4C29.7 35.1 27 36 24 36c-5.7 0-10.2-3.4-11.7-8.3l-6.9 5.3C8.8 39.8 15.9 44 24 44z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.7c-.6 2-2 3.8-3.7 5.1l6.6 5.4C42 35.8 44.5 30.3 44.5 24c0-1.3-.1-2.7-.2-4z" fill="#1976D2"/>
    </svg>
  )
}

export default function Auth() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])

  const [mode, setMode]             = useState(location.pathname === '/registrati' ? 'register' : 'login')
  const [nome, setNome]             = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [conferma, setConferma]     = useState('')
  const [error, setError]           = useState('')
  const [info, setInfo]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const switchMode = (m) => { setMode(m); setError(''); setInfo('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setInfo('')

    if (mode === 'register') {
      if (!nome.trim()) return setError('Inserisci il tuo nome.')
      if (password.length < 6) return setError('La password deve essere di almeno 6 caratteri.')
      if (password !== conferma) return setError('Le password non coincidono.')
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: nome.trim() } },
        })
        if (error) throw error
        setInfo('Controlla la tua email per confermare l\'account, poi accedi.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials'))  setError('Email o password errati.')
      else if (msg.includes('Email not confirmed'))   setError('Conferma prima la tua email.')
      else if (msg.includes('User already registered')) setError('Esiste già un account con questa email.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true); setError('')
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'it.bertie.app://auth/callback',
          skipBrowserRedirect: true,
        },
      })
      if (error) { setError(error.message); setGoogleLoading(false); return }
      await Browser.open({ url: data.url })
      setGoogleLoading(false)
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) { setError(error.message); setGoogleLoading(false) }
    }
  }

  const handleForgotPassword = async () => {
    if (!email) return setError('Inserisci la tua email per reimpostare la password.')
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setInfo('Email di recupero inviata! Controlla la casella di posta.')
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pb-10" style={{ backgroundColor: G.cream, paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}>

        {/* Logo + titolo */}
        <div className="mb-8">
          <img src="/bertie-wordmark.svg" alt="Bertie" style={{ width: 140, marginBottom: 8 }} />
          <p className="text-sm" style={{ color: G.ink500 }}>
            {mode === 'login' ? 'Bentornato! Accedi al tuo account.' : 'Crea il tuo account gratuito.'}
          </p>
        </div>

        {/* Toggle login / registrati */}
        <div className="flex rounded-[14px] p-1 mb-6" style={{ backgroundColor: G.cream200 }}>
          {[{ v: 'login', l: 'Accedi' }, { v: 'register', l: 'Registrati' }].map(({ v, l }) => (
            <button key={v} onClick={() => switchMode(v)}
              className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-colors"
              style={{
                backgroundColor: mode === v ? G.gold : 'transparent',
                color: mode === v ? '#FFFFFF' : G.ink500,
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {mode === 'register' && (
            <input
              type="text"
              placeholder="Il tuo nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ backgroundColor: G.cream50, borderRadius: 14, color: G.ink }}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 text-sm outline-none"
            style={{ backgroundColor: G.cream50, borderRadius: 14, color: G.ink }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 text-sm outline-none"
            style={{ backgroundColor: G.cream50, borderRadius: 14, color: G.ink }}
            required
          />

          {mode === 'register' && (
            <input
              type="password"
              placeholder="Conferma password"
              value={conferma}
              onChange={e => setConferma(e.target.value)}
              className="w-full px-4 py-3.5 text-sm outline-none"
              style={{ backgroundColor: G.cream50, borderRadius: 14, color: G.ink }}
              required
            />
          )}

          {mode === 'login' && (
            <button type="button" onClick={handleForgotPassword}
              className="text-right text-xs font-semibold"
              style={{ color: G.gold }}>
              Password dimenticata?
            </button>
          )}

          {/* Feedback errore / info */}
          {error && (
            <div className="px-4 py-3 text-xs font-semibold"
              style={{ backgroundColor: G.errorBg, borderRadius: 12, color: G.error }}>
              ⚠️ {error}
            </div>
          )}
          {info && (
            <div className="px-4 py-3 text-xs font-semibold"
              style={{ backgroundColor: '#F0FBF4', borderRadius: 12, color: '#2E7D52' }}>
              ✅ {info}
            </div>
          )}

          {/* CTA principale */}
          <button type="submit" disabled={loading}
            className="w-full py-4 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            style={{ backgroundColor: G.gold, color: '#FFFFFF', borderRadius: 999 }}>
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>

        {/* Divisore */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ backgroundColor: G.cream200 }} />
          <span className="text-xs font-semibold" style={{ color: G.ink500 }}>oppure</span>
          <div className="flex-1 h-px" style={{ backgroundColor: G.cream200 }} />
        </div>

        {/* Google OAuth */}
        <button onClick={handleGoogle} disabled={googleLoading}
          className="w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-3 disabled:opacity-50"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 999,
            border: `1.5px solid ${G.cream200}`,
            color: G.ink,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          {googleLoading
            ? <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: G.gold, borderTopColor: 'transparent' }} />
            : <GoogleIcon />
          }
          {mode === 'login' ? 'Accedi con Google' : 'Registrati con Google'}
        </button>

        {mode === 'register' && (
          <p className="text-center text-xs mt-5" style={{ color: G.ink500 }}>
            Continuando accetti i{' '}
            <span className="font-semibold" style={{ color: G.gold }}>Termini di servizio</span>
            {' '}e la{' '}
            <span className="font-semibold" style={{ color: G.gold }}>Privacy Policy</span>.
          </p>
        )}

      </div>
    </AppShell>
  )
}
