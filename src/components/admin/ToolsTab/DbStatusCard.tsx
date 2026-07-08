import { useState } from 'react'
import { toast } from 'sonner'
import type { Movie } from '@/types'

interface DbStatusCardProps {
  localMovies: Movie[]
  runMigration: () => Promise<void>
  backfillSlugs: () => Promise<number>
  refetch: () => void
}

export default function DbStatusCard({
  localMovies,
  runMigration,
  backfillSlugs,
  refetch,
}: DbStatusCardProps) {
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
    <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Database Status</h3>
      <button
        onClick={testConnection}
        className="px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3"
      >
        Test Connection
      </button>
      <button
        onClick={async () => {
          try {
            await runMigration()
            toast.success('Migration ran successfully')
          } catch {
            toast.error('Migration failed')
          }
        }}
        className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3"
      >
        Run Migration
      </button>
      <button
        onClick={async () => {
          try {
            const n = await backfillSlugs()
            toast.success(`Backfilled ${n} slugs`)
            refetch()
          } catch {
            toast.error('Backfill failed')
          }
        }}
        className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3"
      >
        Backfill Slugs
      </button>
      {dbStatus === 'checking' && <p className="text-[12px] text-yellow-400">Checking...</p>}
      {dbStatus === 'ok' && <p className="text-[12px] text-green-400">Connected</p>}
      {dbStatus === 'fail' && <p className="text-[12px] text-cinema-red">Connection failed</p>}
      <div className="mt-3 text-[11px] text-white/30 space-y-1">
        <p>
          Movies in DB: <span className="text-white/50">{localMovies.length}</span>
        </p>
        <p>
          API Base: <span className="text-white/50">/api</span>
        </p>
      </div>
    </div>
  )
}
