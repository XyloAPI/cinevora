import { useSeries } from '@/hooks/useMovies'
import MovieRow from '@/components/sections/MovieRow'
import MovieGrid from '@/components/sections/MovieGrid'
import SEO from '@/components/shared/SEO'
import { MovieRowSkeleton, MovieGridSkeleton } from '@/components/shared/Skeleton'

export default function SeriesPage() {
  const { data: series = [], isLoading } = useSeries()

  return (
    <>
      <SEO title="Serial" description="Koleksi serial TV terbaru dengan subtitle Indonesia." />
      {isLoading ? <MovieRowSkeleton /> : <MovieRow title="Serial Populer" movies={series} />}
      {isLoading ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Semua Serial" movies={series} />}
    </>
  )
}
