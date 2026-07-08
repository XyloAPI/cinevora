import { useMemo } from 'react'
import {
  IconBrandYoutube,
  IconWorld,
  IconAlertTriangle,
  IconHistory,
  IconMovie,
  IconDeviceTv,
} from '@tabler/icons-react'
import type { Movie } from '@/types'
import MetricCards from './MetricCards'
import HealthCharts from './HealthCharts'

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
  // 1. Average Rating Calculation
  const averageRating = useMemo(() => {
    const rated = localMovies.filter((m) => m.rating > 0)
    if (rated.length === 0) return '0.0'
    const sum = rated.reduce((acc, m) => acc + m.rating, 0)
    return (sum / rated.length).toFixed(1)
  }, [localMovies])

  // 2. Stream & Trailer percentages
  const streamPct = useMemo(() => {
    if (localMovies.length === 0) return 0
    return Math.round((stats.withStream / localMovies.length) * 100)
  }, [localMovies, stats.withStream])

  const trailerPct = useMemo(() => {
    if (localMovies.length === 0) return 0
    return Math.round((stats.withTrailer / localMovies.length) * 100)
  }, [localMovies, stats.withTrailer])

  // 3. Top Genres Calculation
  const topGenres = useMemo(() => {
    const counts: Record<string, number> = {}
    localMovies.forEach((m) => {
      if (Array.isArray(m.genre)) {
        m.genre.forEach((g) => {
          counts[g] = (counts[g] || 0) + 1
        })
      }
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [localMovies])

  // 4. Missing elements list for auditing
  const missingStreams = useMemo(() => {
    return localMovies.filter((m) => !m.streamUrl).slice(0, 5)
  }, [localMovies])

  const missingTrailers = useMemo(() => {
    return localMovies.filter((m) => !m.trailerUrl).slice(0, 5)
  }, [localMovies])

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-bold mb-1">Dashboard Overview</h2>
        <p className="text-[11px] text-white/40">Real-time database analytics and library visualization.</p>
      </div>

      {/* Counters Grid - Subcomponent */}
      <MetricCards stats={stats} />

      {/* Recharts Analytics & Charts Grid - Subcomponent */}
      <HealthCharts
        stats={stats}
        topGenres={topGenres}
        averageRating={averageRating}
        streamPct={streamPct}
        trailerPct={trailerPct}
      />

      {/* Database Quality Audit / To-Do List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missing Stream Links Box */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <IconAlertTriangle size={14} className="text-orange-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Needs Stream Links ({missingStreams.length === 5 ? '5+' : missingStreams.length})</h3>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-400 font-semibold border border-orange-400/20">Audit Alert</span>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {missingStreams.length === 0 ? (
              <p className="text-[11px] text-green-400/80 py-4 text-center">✓ All titles have stream links!</p>
            ) : (
              missingStreams.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-black/15 p-2 rounded border border-white/[0.02] text-[11px]">
                  <span className="font-medium truncate max-w-[200px] text-white/80">{m.title}</span>
                  <span className="text-[10px] text-orange-400/70 flex items-center gap-1 bg-orange-400/5 px-1.5 py-0.5 rounded">
                    {m.type === 'series' ? <IconDeviceTv size={10} /> : <IconMovie size={10} />}
                    {m.type || 'movie'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Missing Trailer Links Box */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <IconAlertTriangle size={14} className="text-pink-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Needs Trailers ({missingTrailers.length === 5 ? '5+' : missingTrailers.length})</h3>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-400/10 text-pink-400 font-semibold border border-pink-400/20">Audit Alert</span>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {missingTrailers.length === 0 ? (
              <p className="text-[11px] text-green-400/80 py-4 text-center">✓ All titles have trailer links!</p>
            ) : (
              missingTrailers.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-black/15 p-2 rounded border border-white/[0.02] text-[11px]">
                  <span className="font-medium truncate max-w-[200px] text-white/80">{m.title}</span>
                  <span className="text-[10px] text-pink-400/70 flex items-center gap-1 bg-pink-400/5 px-1.5 py-0.5 rounded">
                    {m.type === 'series' ? <IconDeviceTv size={10} /> : <IconMovie size={10} />}
                    {m.type || 'movie'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Movie Additions */}
      <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <IconHistory size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Recently Added Titles</h3>
        </div>
        <div className="space-y-2">
          {localMovies.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-[12px] bg-black/10 hover:bg-black/20 p-2 rounded-lg border border-white/[0.02] transition-colors">
              <div className="w-8 h-12 rounded overflow-hidden bg-cinema-800 shrink-0 border border-white/[0.05]">
                <img src={m.poster} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium block text-white/90 truncate">{m.title}</span>
                <span className="text-white/30 text-[10px]">{m.year}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {m.trailerUrl ? (
                  <IconBrandYoutube size={14} className="text-cinema-red" title="Has Trailer" />
                ) : (
                  <IconBrandYoutube size={14} className="text-white/10" title="No Trailer" />
                )}
                {m.streamUrl ? (
                  <IconWorld size={14} className="text-green-400" title="Has Stream" />
                ) : (
                  <IconWorld size={14} className="text-white/10" title="No Stream" />
                )}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                  m.type === 'series'
                    ? 'bg-purple-600/10 border-purple-500/20 text-purple-400'
                    : 'bg-green-600/10 border-green-500/20 text-green-400'
                }`}>
                  {m.type === 'series' ? 'TV' : 'Movie'}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                  m.isTrending
                    ? 'bg-cinema-red/10 border-cinema-red/20 text-cinema-red'
                    : 'bg-white/5 border-white/[0.04] text-white/20'
                }`}>
                  {m.isTrending ? 'Trending' : 'Standard'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
