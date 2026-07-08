import { useMemo } from 'react'
import {
  IconBrandYoutube,
  IconWorld,
  IconStarFilled,
  IconAlertTriangle,
  IconChartBar,
  IconHistory,
  IconMovie,
  IconDeviceTv,
} from '@tabler/icons-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
} from 'recharts'
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

  // 5. Chart Data Prep
  const contentMixData = useMemo(() => {
    return [
      { name: 'Movies', value: stats.movies, color: '#10b981' },
      { name: 'TV Series', value: stats.series, color: '#a855f7' },
      { name: 'Coming Soon', value: stats.comingSoon, color: '#eab308' },
    ].filter((d) => d.value > 0)
  }, [stats])

  const genreChartData = useMemo(() => {
    return topGenres.map(([name, value]) => ({
      name,
      value,
    }))
  }, [topGenres])

  const healthRingData = useMemo(() => {
    return [
      { name: 'Trailer Links', value: trailerPct, fill: '#ec4899' },
      { name: 'Stream Links', value: streamPct, fill: '#10b981' },
    ]
  }, [streamPct, trailerPct])

  // Custom tooltip component for Recharts
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-cinema-950/95 border border-white/[0.08] backdrop-blur-md px-3 py-2 rounded-lg text-[11px] shadow-xl">
          <p className="font-semibold text-white">{payload[0].name}</p>
          <p className="text-cinema-red font-medium mt-0.5">
            {payload[0].value} {payload[0].name.includes('Links') || payload[0].name.includes('Coverage') ? '%' : 'titles'}
          </p>
        </div>
      )
    }
    return null
  }

  const genreColors = ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b']

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-bold mb-1">Dashboard Overview</h2>
        <p className="text-[11px] text-white/40">Real-time database analytics and library visualization.</p>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Database', value: stats.total, color: 'bg-blue-600/10 border-blue-500/20 text-blue-400' },
          { label: 'Movies', value: stats.movies, color: 'bg-green-600/10 border-green-500/20 text-green-400' },
          { label: 'TV Series', value: stats.series, color: 'bg-purple-600/10 border-purple-500/20 text-purple-400' },
          { label: 'Trending', value: stats.trending, color: 'bg-cinema-red/10 border-cinema-red/20 text-cinema-red' },
          { label: 'Coming Soon', value: stats.comingSoon, color: 'bg-yellow-600/10 border-yellow-500/20 text-yellow-400' },
          { label: 'Total Genres', value: stats.genres, color: 'bg-cyan-600/10 border-cyan-500/20 text-cyan-400' },
          { label: 'With Trailer', value: stats.withTrailer, color: 'bg-pink-600/10 border-pink-500/20 text-pink-400' },
          { label: 'With Stream', value: stats.withStream, color: 'bg-orange-600/10 border-orange-500/20 text-orange-400' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-lg p-3 border`}>
            <p className="text-[9px] uppercase tracking-wider opacity-60 mb-0.5 truncate">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Content Mix (Donut Chart) */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconChartBar size={16} className="text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Content Mix</h3>
            </div>
            
            <div className="relative w-full h-[180px] flex items-center justify-center">
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-white">{stats.total}</span>
                <span className="text-[8px] uppercase tracking-wider text-white/30 font-bold">Total Titles</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentMixData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {contentMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex justify-center gap-4 text-[10px] text-white/60">
            {contentMixData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Health Ring Gauge */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <IconStarFilled size={16} className="text-yellow-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Database Health</h3>
              </div>
              <span className="text-[14px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                ★ {averageRating} <span className="text-[9px] text-white/40">avg</span>
              </span>
            </div>

            <div className="relative w-full h-[180px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="85%"
                  barSize={12}
                  data={healthRingData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    dataKey="value"
                    cornerRadius={6}
                  />
                  <Tooltip content={customTooltip} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex justify-center gap-6 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-white/60">Stream URL Coverage ({streamPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
              <span className="text-white/60">Trailer Link ({trailerPct}%)</span>
            </div>
          </div>
        </div>

        {/* Genre Share (Horizontal Bar Chart) */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <IconMovie size={16} className="text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Top Genres</h3>
            </div>
            
            <div className="w-full h-[180px]">
              {genreChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[11px] text-white/30">
                  No genre statistics available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={genreChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: 500 }}
                    />
                    <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                    <Bar
                      dataKey="value"
                      fill="#a855f7"
                      radius={[0, 4, 4, 0]}
                      barSize={10}
                    >
                      {genreChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={genreColors[index % genreColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="text-[9px] text-white/30 text-center uppercase tracking-wider font-semibold">
            Count of titles in database
          </div>
        </div>
      </div>

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
