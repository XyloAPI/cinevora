import { useSeries, useLatestMovies, useAllMovies, useGenres, useComingSoon } from '@/hooks/useMovies'
import HeroCarousel from '@/components/sections/HeroCarousel'
import MovieRow from '@/components/sections/MovieRow'
import MovieGrid from '@/components/sections/MovieGrid'
import CategoriesGrid from '@/components/sections/CategoriesGrid'
import ComingSoon from '@/components/sections/ComingSoon'
import SEO from '@/components/shared/SEO'
import { MovieRowSkeleton, MovieGridSkeleton } from '@/components/shared/Skeleton'

export default function HomePage() {
  const { data: series = [], isLoading: seriesLoad } = useSeries()
  const { data: moviesOnly = [], isLoading: moviesLoad } = useLatestMovies()
  const { data: allMovies = [], isLoading: allLoad } = useAllMovies()
  const { data: genres = [], isLoading: genresLoad } = useGenres()
  const { data: upcoming = [], isLoading: comingLoad } = useComingSoon()

  return (
    <>
      <SEO />
      <HeroCarousel />
      {moviesLoad ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Latest Movies" movies={moviesOnly} />}
      {seriesLoad ? <MovieRowSkeleton /> : <MovieRow title="Popular Series" movies={series} />}
      {genresLoad ? <MovieGridSkeleton count={8} /> : <CategoriesGrid genres={genres} />}
      {allLoad ? <MovieGridSkeleton /> : <MovieGrid title="All Releases" movies={allMovies} />}
      {comingLoad ? <MovieGridSkeleton count={3} /> : <ComingSoon movies={upcoming} />}
    </>
  )
}
