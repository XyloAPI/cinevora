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
        <div className="flex flex-wrap gap-3">
          {upcoming.map((movie) => (
            <MovieCard key={movie.id} movie={movie} compact countdownDate={movie.releaseDate} />
          ))}
        </div>
      </div>
    </section>
  )
}
