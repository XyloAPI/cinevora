import { useGenres } from '@/hooks/useMovies'
import CategoriesGrid from '@/components/sections/CategoriesGrid'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'

export default function GenresPage() {
  const { data: genres = [], isLoading } = useGenres()

  return (
    <>
      <SEO title="Genres" description="Jelajahi film dan series berdasarkan genre." />
      {isLoading ? <MovieGridSkeleton count={8} /> : <CategoriesGrid genres={genres} />}
    </>
  )
}
