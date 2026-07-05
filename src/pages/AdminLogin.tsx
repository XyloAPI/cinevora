import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLock } from '@tabler/icons-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validUser = import.meta.env.VITE_ADMIN_USERNAME
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD

    if (username === validUser && password === validPass) {
      sessionStorage.setItem('admin_auth', 'true')
      navigate('/buahlilguanteng')
    } else {
      setError('Invalid credentials')
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
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
            />
            {error && <p className="text-[11px] text-cinema-red">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-cinema-red text-white text-[13px] font-medium rounded hover:bg-cinema-red-dark transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
