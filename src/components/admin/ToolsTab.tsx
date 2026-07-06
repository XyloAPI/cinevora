import { useState } from 'react'
import { toast } from 'sonner'
import type { Movie } from '@/types'

interface ToolsTabProps {
  localMovies: Movie[]
  refetch: () => void
  runMigration: () => Promise<void>
  backfillSlugs: () => Promise<number>
  slugify: (text: string) => string
}

export default function ToolsTab({
  localMovies,
  refetch,
  runMigration,
  backfillSlugs,
  slugify,
}: ToolsTabProps) {
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle')

  async function testConnection() {
    setDbStatus('checking')
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT COUNT(*) as count FROM movies', params: [] }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDbStatus('ok')
    } catch {
      setDbStatus('fail')
    }
  }

  return (
    <section>
      <h2 className="text-base font-bold mb-4">Developer Tools</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Database Status</h3>
          <button onClick={testConnection}
            className="px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
            Test Connection
          </button>
          <button onClick={async () => {
            try {
              await runMigration()
              toast.success('Migration ran successfully')
            } catch {
              toast.error('Migration failed')
            }
          }}
            className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
            Run Migration
          </button>
          <button onClick={async () => {
            try {
              const n = await backfillSlugs()
              toast.success(`Backfilled ${n} slugs`)
              refetch()
            } catch {
              toast.error('Backfill failed')
            }
          }}
            className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
            Backfill Slugs
          </button>
          {dbStatus === 'checking' && <p className="text-[12px] text-yellow-400">Checking...</p>}
          {dbStatus === 'ok' && <p className="text-[12px] text-green-400">Connected</p>}
          {dbStatus === 'fail' && <p className="text-[12px] text-cinema-red">Connection failed</p>}
          <div className="mt-3 text-[11px] text-white/30 space-y-1">
            <p>Movies in DB: <span className="text-white/50">{localMovies.length}</span></p>
            <p>API Base: <span className="text-white/50">/api</span></p>
          </div>
        </div>

        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Export Data</h3>
          <div className="space-y-2">
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(localMovies, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `movies-${new Date().toISOString().slice(0, 10)}.json`
              a.click()
            }}
              className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]">
              Export Movies as JSON
            </button>
            <button onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(localMovies, null, 2))
              toast.success('Copied to clipboard')
            }}
              className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]">
              Copy All Movies to Clipboard
            </button>
          </div>
        </div>

        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Movie Slugs</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {localMovies.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-[11px]">
                <span className="text-white/50 truncate flex-1">{m.title}</span>
                <span className="text-white/20">→</span>
                <span className="text-cyan-400/70">{slugify(m.title)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Quick Info</h3>
          <div className="space-y-2 text-[12px] text-white/50">
            <p>Env: <span className="text-white/70">{import.meta.env.MODE}</span></p>
            <p>Base URL: <span className="text-white/70">{window.location.origin}</span></p>
            <p>Admin Path: <span className="text-cinema-red">/buahlilguanteng</span></p>
            <p>TMDB API: <span className="text-white/70">{import.meta.env.VITE_TMDB_API_KEY ? 'Configured' : 'Missing'}</span></p>
            <p className="text-[10px] text-white/20 mt-4">Built with React + Vite + TypeScript + Tailwind + Turso DB + TMDB</p>
          </div>
        </div>
      </div>
    </section>
  )
}
