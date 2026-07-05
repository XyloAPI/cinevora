import { useLatestMovies, useAllMovies, useComingSoon as useComingSoonMovies } from '@/hooks/useMovies'
import MovieGrid from '@/components/sections/MovieGrid'
import ComingSoon from '@/components/sections/ComingSoon'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'
import MovieCard from '@/components/shared/MovieCard'

export default function MoviesPage() {
  const { data: moviesOnly = [], isLoading: latestLoad } = useLatestMovies()
  const { data: allMovies = [], isLoading: allLoad } = useAllMovies()
  const { data: upcoming = [], isLoading: comingLoad } = useComingSoonMovies()

  return (
    <>
      <SEO title="Movies" description="Koleksi film lengkap dengan subtitle Indonesia." />
      {latestLoad ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Latest Movies" movies={moviesOnly} />}
      {allLoad ? <MovieGridSkeleton /> : <MovieGrid title="All Releases" movies={allMovies} />}
      {comingLoad ? <MovieGridSkeleton count={3} /> : <ComingSoon movies={upcoming} />}
    </>
  )
}
