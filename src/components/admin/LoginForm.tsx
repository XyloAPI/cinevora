import { useState } from 'react'
import { IconLock } from '@tabler/icons-react'

interface LoginFormProps {
  onLogin: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const res = await fetch(`${apiBase}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_token', data.token)
        sessionStorage.setItem('admin_auth', 'true')
        onLogin()
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinema-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <img src="/Cinevora.avif" alt="Cinevora" className="h-8" />
        </div>
        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconLock size={16} className="text-white/40" />
            <h1 className="text-sm font-semibold">Admin Access</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 disabled:opacity-50" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 disabled:opacity-50" />
            {error && <p className="text-[11px] text-cinema-red">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 bg-cinema-red text-white text-[13px] font-medium rounded hover:bg-cinema-red-dark transition-colors disabled:opacity-50">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
