import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppShell from '../components/AppShell'

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState(location.pathname === '/registrati' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        navigate('/onboarding')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col px-6 pt-16 pb-10">
        <Link to="/" className="mb-2 flex items-center gap-2">
          <span className="text-3xl font-extrabold font-nunito" style={{ color: '#2A2C2C' }}>
            🐾 Bertie
          </span>
        </Link>
        <p className="text-sm mb-10" style={{ color: '#6B6E6E' }}>
          {mode === 'login' ? 'Bentornato! Accedi al tuo account.' : 'Crea il tuo account gratuito.'}
        </p>

        {/* Toggle login / registra */}
        <div className="flex rounded-btn p-1 mb-6" style={{ backgroundColor: '#EFE0A8' }}>
          {[{ v: 'login', l: 'Accedi' }, { v: 'register', l: 'Registrati' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => { setMode(v); setError('') }}
              className="flex-1 py-3 rounded-btn text-sm font-semibold transition-colors"
              style={{
                backgroundColor: mode === v ? '#E8A859' : 'transparent',
                color: mode === v ? '#FFFFFF' : '#6B6E6E',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 rounded-card text-sm border-0 focus:outline-none focus:ring-2 ring-sky-blue placeholder-slate-gray"
            style={{ backgroundColor: '#F6ECC8', color: '#2A2C2C' }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-card text-sm border-0 focus:outline-none focus:ring-2 ring-sky-blue placeholder-slate-gray"
            style={{ backgroundColor: '#F6ECC8', color: '#2A2C2C' }}
            required
          />
          {mode === 'login' && (
            <button type="button" className="text-right text-xs font-semibold" style={{ color: '#E8A859' }}>
              Password dimenticata?
            </button>
          )}

          {error && (
            <div className="px-4 py-3 rounded-card text-sm font-semibold" style={{ backgroundColor: '#F0B97A', color: '#2A2C2C' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="mt-auto pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-btn font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: '#E8A859', color: '#FFFFFF' }}
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {mode === 'login' ? 'Accedi' : 'Crea account gratuito'}
            </button>
            {mode === 'register' && (
              <p className="text-center text-xs mt-4" style={{ color: '#6B6E6E' }}>
                Continuando accetti i{' '}
                <span className="font-semibold" style={{ color: '#E8A859' }}>Termini di servizio</span>
                {' '}e la{' '}
                <span className="font-semibold" style={{ color: '#E8A859' }}>Privacy Policy</span>.
              </p>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  )
}
