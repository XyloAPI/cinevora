interface MetricCardsProps {
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
}

export default function MetricCards({ stats }: MetricCardsProps) {
  const cards = [
    { label: 'Total Database', value: stats.total, color: 'bg-blue-600/10 border-blue-500/20 text-blue-400' },
    { label: 'Movies', value: stats.movies, color: 'bg-green-600/10 border-green-500/20 text-green-400' },
    { label: 'TV Series', value: stats.series, color: 'bg-purple-600/10 border-purple-500/20 text-purple-400' },
    { label: 'Trending', value: stats.trending, color: 'bg-cinema-red/10 border-cinema-red/20 text-cinema-red' },
    { label: 'Coming Soon', value: stats.comingSoon, color: 'bg-yellow-600/10 border-yellow-500/20 text-yellow-400' },
    { label: 'Total Genres', value: stats.genres, color: 'bg-cyan-600/10 border-cyan-500/20 text-cyan-400' },
    { label: 'With Trailer', value: stats.withTrailer, color: 'bg-pink-600/10 border-pink-500/20 text-pink-400' },
    { label: 'With Stream', value: stats.withStream, color: 'bg-orange-600/10 border-orange-500/20 text-orange-400' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((s) => (
        <div key={s.label} className={`${s.color} rounded-lg p-3 border`}>
          <p className="text-[9px] uppercase tracking-wider opacity-60 mb-0.5 truncate">{s.label}</p>
          <p className="text-xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  )
}
