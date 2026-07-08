import type { Movie } from '@/types'

interface SlugViewCardProps {
  localMovies: Movie[]
  slugify: (text: string) => string
}

export default function SlugViewCard({ localMovies, slugify }: SlugViewCardProps) {
  return (
    <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3">Movie Slugs</h3>
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {localMovies.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-[11px]">
            <span className="text-white/50 truncate flex-1">
              {m.title} ({m.year})
            </span>
            <span className="text-white/20">→</span>
            <span className="text-cyan-400/70">{slugify(`${m.title} ${m.year}`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
