import MovieCard from '@/components/shared/MovieCard'
import type { Movie } from '@/types'

interface ComingSoonProps {
  movies?: Movie[]
}

export default function ComingSoon({ movies: upcoming = [] }: ComingSoonProps) {
  if (!upcoming.length) return null

  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="text-base sm:text-lg font-bold">Coming Soon</h2>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-3">
          {upcoming.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} compact grid fetchPriority={i < 6 ? 'high' : 'auto'} countdownDate={movie.releaseDate} />
          ))}
        </div>
      </div>
    </section>
  )
}
