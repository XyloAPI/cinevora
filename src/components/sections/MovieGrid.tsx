import { Link } from 'react-router-dom'
import MovieCard from '@/components/shared/MovieCard'
import type { Movie } from '@/types'

interface MovieGridProps {
  title: string
  movies: Movie[]
  id?: string
}

export default function MovieGrid({ title, movies, id }: MovieGridProps) {
  return (
    <section id={id} className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold">{title}</h2>
          <Link to="/" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">View All</Link>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-3 items-start">
          {movies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} compact grid fetchPriority={i < 6 ? 'high' : 'auto'} />
          ))}
        </div>
      </div>
    </section>
  )
}
