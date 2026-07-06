import { IconBrandYoutube, IconWorld } from '@tabler/icons-react'
import type { Movie } from '@/types'

interface DashboardTabProps {
  stats: {
    total: number
    movies: number
    series: number
    trending: number
    comingSoon: number
    genres: number
    withTrailer: number
    withStream: number
  }
  localMovies: Movie[]
}

export default function DashboardTab({ stats, localMovies }: DashboardTabProps) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-600/20 text-blue-400' },
          { label: 'Movies', value: stats.movies, color: 'bg-green-600/20 text-green-400' },
          { label: 'Series', value: stats.series, color: 'bg-purple-600/20 text-purple-400' },
          { label: 'Trending', value: stats.trending, color: 'bg-cinema-red/20 text-cinema-red' },
          { label: 'Coming Soon', value: stats.comingSoon, color: 'bg-yellow-600/20 text-yellow-400' },
          { label: 'Genres', value: stats.genres, color: 'bg-cyan-600/20 text-cyan-400' },
          { label: 'With Trailer', value: stats.withTrailer, color: 'bg-pink-600/20 text-pink-400' },
          { label: 'With Stream', value: stats.withStream, color: 'bg-orange-600/20 text-orange-400' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-lg p-4 border border-white/[0.04]`}>
            <p className="text-[11px] uppercase tracking-wider opacity-60 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Movies</h3>
        <div className="space-y-2">
          {localMovies.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-[13px]">
              <div className="w-8 h-12 rounded overflow-hidden bg-cinema-800 shrink-0">
                <img src={m.poster} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="flex-1 truncate">{m.title}</span>
              <span className="text-white/30 text-[11px]">{m.year}</span>
              {m.trailerUrl && <IconBrandYoutube size={12} className="text-cinema-red" />}
              {m.streamUrl && <IconWorld size={12} className="text-green-400" />}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.type === 'series' ? 'bg-purple-600/20 text-purple-400' : 'bg-green-600/20 text-green-400'}`}>
                {m.type || 'movie'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.isTrending ? 'bg-cinema-red/20 text-cinema-red' : 'bg-white/5 text-white/20'}`}>
                {m.isTrending ? 'Trending' : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
