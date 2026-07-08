import { toast } from 'sonner'
import type { Movie } from '@/types'

interface ExportCardProps {
  localMovies: Movie[]
}

export default function ExportCard({ localMovies }: ExportCardProps) {
  return (
    <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Export Data</h3>
      <div className="space-y-2">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(localMovies, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `movies-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
          }}
          className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]"
        >
          Export Movies as JSON
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(localMovies, null, 2))
            toast.success('Copied to clipboard')
          }}
          className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]"
        >
          Copy All Movies to Clipboard
        </button>
      </div>
    </div>
  )
}
