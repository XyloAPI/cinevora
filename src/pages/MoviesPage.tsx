import { useSearchParams, Link } from 'react-router-dom'
import { useLatestMovies, useAllMovies, useComingSoon as useComingSoonMovies } from '@/hooks/useMovies'
import MovieGrid from '@/components/sections/MovieGrid'
import ComingSoon from '@/components/sections/ComingSoon'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'
import { IconArrowLeft } from '@tabler/icons-react'

export default function MoviesPage() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search')

  const { data: moviesOnly = [], isLoading: latestLoad } = useLatestMovies()
  const { data: allMovies = [], isLoading: allLoad } = useAllMovies()
  const { data: upcoming = [], isLoading: comingLoad } = useComingSoonMovies()

  if (searchQuery) {
    const query = decodeURIComponent(searchQuery).trim()
    const filteredMovies = allMovies.filter((movie) => {
      const titleMatch = movie.title?.toLowerCase().includes(query.toLowerCase())
      const synopsisMatch = movie.synopsis?.toLowerCase().includes(query.toLowerCase())
      const genreMatch = Array.isArray(movie.genre) && movie.genre.some((g: string) => g.toLowerCase().includes(query.toLowerCase()))
      return titleMatch || synopsisMatch || genreMatch
    })

    return (
      <div className="pt-14">
        <SEO title={`Search: ${query}`} description={`Hasil pencarian film untuk: ${query}`} />
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/movies" className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors">
              <IconArrowLeft size={14} /> Back to Movies
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-white">Search Results for: "{query}"</h1>
          {allLoad ? (
            <MovieGridSkeleton count={8} />
          ) : filteredMovies.length > 0 ? (
            <MovieGrid title="" movies={filteredMovies} />
          ) : (
            <div className="text-center py-16 text-white/40 text-sm bg-cinema-900 rounded-lg border border-white/[0.04]">
              No movies found matching "{query}". Try checking your spelling or looking for other titles!
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <SEO title="Movies" description="Koleksi film lengkap dengan subtitle Indonesia." />
      {latestLoad ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Latest Movies" movies={moviesOnly} />}
      {allLoad ? <MovieGridSkeleton /> : <MovieGrid title="All Releases" movies={allMovies} />}
      {comingLoad ? <MovieGridSkeleton count={3} /> : <ComingSoon movies={upcoming} />}
    </div>
  )
}
