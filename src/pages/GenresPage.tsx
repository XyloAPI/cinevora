import { useSearchParams, Link } from 'react-router-dom'
import { useGenres, useAllMovies } from '@/hooks/useMovies'
import CategoriesGrid from '@/components/sections/CategoriesGrid'
import MovieGrid from '@/components/sections/MovieGrid'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'
import { IconArrowLeft } from '@tabler/icons-react'

export default function GenresPage() {
  const [searchParams] = useSearchParams()
  const genreParam = searchParams.get('genre')

  const { data: genres = [], isLoading: genresLoading } = useGenres()
  const { data: allMovies = [], isLoading: moviesLoading } = useAllMovies()

  if (genreParam) {
    const selectedGenre = decodeURIComponent(genreParam)
    const filteredMovies = allMovies.filter((movie) =>
      movie.genre.some((g: string) => g.toLowerCase() === selectedGenre.toLowerCase())
    )

    return (
      <div className="pt-14">
        <SEO title={`Genre: ${selectedGenre}`} description={`Jelajahi film dengan genre ${selectedGenre}.`} />
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/genres" className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors">
              <IconArrowLeft size={14} /> Back to Genres
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-6">Genre: {selectedGenre}</h1>
          {moviesLoading ? (
            <MovieGridSkeleton count={8} />
          ) : filteredMovies.length > 0 ? (
            <MovieGrid title="" movies={filteredMovies} />
          ) : (
            <div className="text-center py-12 text-white/40 text-sm">
              No movies found in this genre.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <SEO title="Genres" description="Jelajahi film dan series berdasarkan genre." />
      {genresLoading ? (
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <MovieGridSkeleton count={8} />
        </div>
      ) : (
        <CategoriesGrid genres={genres} />
      )}
    </div>
  )
}
