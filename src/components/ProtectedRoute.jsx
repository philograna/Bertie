import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/useSession'

export default function ProtectedRoute({ children }) {
  const session = useSession()

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#1B1B2F] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-sky-blue border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return children
}
