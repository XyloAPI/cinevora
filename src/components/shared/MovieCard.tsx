import { Link } from 'react-router-dom'
import { IconClock } from '@tabler/icons-react'
import { formatDistanceToNow, format } from 'date-fns'
import { slugify } from '@/lib/utils'
import LazyImage from '@/components/shared/LazyImage'
import type { Movie } from '@/types'

interface MovieCardProps {
  movie: Movie
  compact?: boolean
  countdownDate?: string
}

function Countdown({ date }: { date: string }) {
  const target = new Date(date)
  const label = target > new Date() ? formatDistanceToNow(target) : 'Soon'
  return (
    <span className="flex items-center gap-1 text-[10px] text-white/40">
      <IconClock size={10} />
      {label}
    </span>
  )
}

function QualityBadge({ quality }: { quality?: string }) {
  if (!quality) return null
  const cls = quality.toLowerCase().replace('-', '').replace(' ', '')
  return <span className={`badge-quality ${cls}`}>{quality}</span>
}

export default function MovieCard({ movie, compact, countdownDate }: MovieCardProps) {
  if (compact) {
    return (
      <Link to={`/movie/${slugify(movie.title)}`} className="group flex-shrink-0 w-[170px] sm:w-[185px]">
        <div className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-800 shadow-lg shadow-black/20 group-hover:shadow-cinema-red/10 transition-shadow duration-300">
            <LazyImage src={movie.poster} alt={movie.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-1.5 right-1.5">
              <QualityBadge quality={movie.quality} />
            </div>
            {movie.rating > 0 && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/60 text-[11px] font-semibold text-yellow-400">
                <span>&#9733;</span>
                <span>{movie.rating}</span>
              </div>
            )}
            {countdownDate && (
              <div className="absolute bottom-1.5 left-1.5">
                <div className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white/60 flex items-center gap-1">
                  <Countdown date={countdownDate} />
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cinema-red/90 shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
          </div>
          <div className="mt-1.5">
            <h3 className="text-[13px] font-medium truncate text-white/80 group-hover:text-white transition-colors duration-300">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/40">
              <span>{movie.year}</span>
              {movie.type === 'series' && movie.seasons && (
                <span className="text-cinema-red/70">S{movie.seasons}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/movie/${slugify(movie.title)}`} className="group block">
      <div className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-cinema-800 shadow-lg shadow-black/20 group-hover:shadow-cinema-red/10 transition-shadow duration-300">
          <LazyImage src={movie.poster} alt={movie.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute top-1.5 left-1.5 flex gap-1 flex-wrap">
            {movie.rating > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-black/70 text-[11px] font-semibold text-yellow-400 flex items-center gap-0.5">
                &#9733; {movie.rating}
              </span>
            )}
            {movie.type === 'series' && (
              <span className="px-1.5 py-0.5 rounded bg-cinema-red/80 text-[10px] text-white font-semibold uppercase">
                Series
              </span>
            )}
          </div>

          <div className="absolute top-1.5 right-1.5">
            <QualityBadge quality={movie.quality} />
          </div>

          {countdownDate ? (
            <div className="absolute bottom-1.5 left-1.5">
              <div className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white/60 flex items-center gap-1">
                <Countdown date={countdownDate} />
              </div>
              {movie.releaseDate && (
                <p className="text-[10px] text-white/40 mt-0.5">{format(new Date(movie.releaseDate), 'MMM d, yyyy')}</p>
              )}
            </div>
          ) : movie.type === 'series' && movie.seasons && movie.episodes ? (
            <div className="absolute bottom-1.5 left-1.5">
              <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white/70">
                {movie.seasons} Season{movie.seasons > 1 ? 's' : ''} &middot; {movie.episodes} Ep
              </span>
            </div>
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cinema-red/90 shadow-lg shadow-black/40 scale-90 group-hover:scale-100 transition-transform duration-300">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-medium truncate text-white/80 group-hover:text-white transition-colors duration-300">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/40">
            <span>{movie.year}</span>
            {movie.duration && <span>{movie.duration}</span>}
          </div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            {movie.genre.slice(0, 2).map((g) => (
              <span key={g} className="text-[10px] text-white/30">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
