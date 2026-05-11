import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(undefined)

/**
 * AuthProvider — avvolge l'app e mantiene la sessione utente aggiornata.
 * Ascolta onAuthStateChange in modo che ogni cambio (login/logout/refresh)
 * propaghi automaticamente a tutti i componenti che usano useAuth().
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined) // undefined = caricamento in corso
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Carica sessione esistente al mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
    })

    // Ascolta cambii di stato auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
      setUser(s?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth() — hook per accedere a { user, session, loading } da qualsiasi componente.
 *
 * Esempio:
 *   const { user, loading } = useAuth()
 *   if (loading) return <Spinner />
 *   if (!user) return <Navigate to="/login" />
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth() deve essere usato dentro <AuthProvider>')
  return ctx
}
