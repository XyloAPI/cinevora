import { useTrendingFromDb } from '@/hooks/useMovies'
import MovieGrid from '@/components/sections/MovieGrid'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'

export default function TrendingPage() {
  const { data: movies = [], isLoading } = useTrendingFromDb()

  return (
    <div className="pt-14">
      <SEO title="Trending" description="Film trending terbaru yang sedang populer." />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Trending This Week</h1>
        {isLoading ? <MovieGridSkeleton count={12} /> : <MovieGrid title="" movies={movies} />}
      </div>
    </div>
  )
}
