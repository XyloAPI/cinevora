import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconStar } from '@tabler/icons-react'
import type { TmdbMovieResult } from '@/types'

interface TmdbRowProps {
  title: string
  movies: TmdbMovieResult[]
}

export default function TmdbRow({ title, movies }: TmdbRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  return (
    <section className="mb-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold">{title}</h2>
          <Link to="/trending" className="text-[12px] text-white/30 hover:text-white transition-colors">View All</Link>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={rowRef} className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {movies.map((m) => (
          <a key={m.id} href={`https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noopener noreferrer"
            className="shrink-0 w-[140px] sm:w-[150px] group">
            <div className="aspect-[2/3] rounded-lg overflow-hidden bg-cinema-800 mb-2">
              {m.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-[11px]">No Poster</div>
              )}
            </div>
            <p className="text-[12px] font-medium truncate text-white/80 group-hover:text-white transition-colors">{m.title}</p>
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <span className="flex items-center gap-0.5"><IconStar size={10} className="text-yellow-400/70" />{m.vote_average.toFixed(1)}</span>
              <span>{m.release_date?.slice(0, 4)}</span>
            </div>
          </a>
        ))}
      </div>
      </div>
    </section>
  )
}
