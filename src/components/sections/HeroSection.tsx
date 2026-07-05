import { Link } from 'react-router-dom'
import { IconPlayerPlayFilled, IconInfoCircle } from '@tabler/icons-react'
import { slugify } from '@/lib/utils'
import { useFeaturedMovie } from '@/hooks/useMovies'

export default function HeroSection() {
  const { data: featured } = useFeaturedMovie()
  if (!featured) return null

  return (
    <section className="relative min-h-[80vh] flex items-end pt-14">
      <div className="absolute inset-0">
        <img
          src={featured.backdrop}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/70 to-cinema-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/90 via-cinema-950/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="px-2 py-0.5 bg-cinema-red text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
              #1 Trending
            </span>
            <span className="text-sm text-yellow-400 font-medium">&#9733; {featured.rating}/10</span>
            <span className="text-sm text-white/40">{featured.year}</span>
            <span className="text-xs text-white/30 px-1.5 py-0.5 border border-white/10 rounded">{featured.quality}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-3">
            {featured.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-white/30 mb-3 flex-wrap">
            {featured.genre.map((g) => (
              <span key={g} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-cinema-red/70" />
                {g}
              </span>
            ))}
            <span className="ml-1">{featured.duration}</span>
          </div>

          <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-md mb-5 line-clamp-2">
            {featured.synopsis}
          </p>

          <div className="flex items-center gap-3">
            <Link to={`/movie/${slugify(featured.title)}`} className="flex items-center gap-2 px-5 py-2.5 bg-cinema-red text-white font-medium rounded hover:bg-cinema-red-dark transition-colors text-sm">
              <IconPlayerPlayFilled size={16} />
              Play Now
            </Link>
            <Link to={`/movie/${slugify(featured.title)}`} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.08] text-white/70 hover:text-white font-medium rounded hover:bg-white/[0.12] transition-colors text-sm">
              <IconInfoCircle size={16} />
              Details
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
