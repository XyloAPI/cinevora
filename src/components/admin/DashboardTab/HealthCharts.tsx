import { useMemo } from 'react'
import {
  IconChartBar,
  IconStarFilled,
  IconMovie,
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

interface HealthChartsProps {
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
  topGenres: [string, number][]
  averageRating: string
  streamPct: number
  trailerPct: number
}

export default function HealthCharts({
  stats,
  topGenres,
  averageRating,
  streamPct,
  trailerPct,
}: HealthChartsProps) {
  // Chart Data Prep
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
                      <Cell key={`cell-${index}`} fill={genreColors[index % genreColors.length]} />
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
  )
}
