import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: implement Supabase auth
  }

  return (
    <main className="min-h-screen bg-pale-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center text-heading-lg font-bold text-ocean-deep font-gilroy mb-8">
          Kompet
        </Link>
        <div className="bg-off-white rounded-card p-8 flex flex-col gap-6">
          <h1 className="text-heading font-bold text-ocean-deep font-gilroy text-center">
            Bentornato
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-5 py-3.5 rounded-card bg-pale-sand text-true-black text-body placeholder-slate-gray border-0 focus:outline-none focus:ring-2 focus:ring-sky-blue"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-5 py-3.5 rounded-card bg-pale-sand text-true-black text-body placeholder-slate-gray border-0 focus:outline-none focus:ring-2 focus:ring-sky-blue"
              required
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-blue text-true-black font-semibold text-body rounded-btn hover:opacity-90 transition-opacity"
            >
              <LogIn size={18} /> Accedi
            </button>
          </form>
          <p className="text-body text-slate-gray text-center">
            Non hai un account?{' '}
            <Link to="/onboarding" className="text-sky-blue font-semibold hover:underline">
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
