import { useEffect, useMemo, useState } from 'react'
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
  const view = searchParams.get('view')
  const query = searchQuery?.trim() || ''
  const [visibleCount, setVisibleCount] = useState(24)

  const { data: moviesOnly = [], isLoading: latestLoad } = useLatestMovies(!query)
  const { data: allMovies = [], isLoading: allLoad } = useAllMovies()
  const { data: upcoming = [], isLoading: comingLoad } = useComingSoonMovies(!query)

  const filteredMovies = useMemo(() => {
    if (!query) return []

    const normalizedQuery = query.toLocaleLowerCase()
    return allMovies.filter((movie) => {
      const titleMatch = movie.title?.toLocaleLowerCase().includes(normalizedQuery) ?? false
      const synopsisMatch = movie.synopsis?.toLocaleLowerCase().includes(normalizedQuery) ?? false
      const genreMatch = Array.isArray(movie.genre) && movie.genre.some(
        (genre) => genre && genre.toLocaleLowerCase().includes(normalizedQuery)
      )
      return titleMatch || synopsisMatch || genreMatch
    })
  }, [allMovies, query])

  useEffect(() => {
    setVisibleCount(24)
  }, [query])

  if (query) {
    return (
      <div className="pt-14">
        <SEO title={`Pencarian: ${query}`} description={`Hasil pencarian film untuk: ${query}`} />
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/movies" className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors">
              <IconArrowLeft size={14} /> Kembali ke Film
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-white">Hasil pencarian untuk: "{query}"</h1>
          {allLoad ? (
            <MovieGridSkeleton count={8} />
          ) : filteredMovies.length > 0 ? (
            <>
              <MovieGrid title="" movies={filteredMovies.slice(0, visibleCount)} />
              {visibleCount < filteredMovies.length && (
                <div className="pb-8 text-center">
                  <p className="mb-3 text-xs text-white/40">
                    Menampilkan {Math.min(visibleCount, filteredMovies.length)} dari {filteredMovies.length} hasil
                  </p>
                  <button
                    onClick={() => setVisibleCount((count) => count + 24)}
                    className="rounded bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/15 hover:text-white"
                  >
                    Muat lainnya
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-white/40 text-sm bg-cinema-900 rounded-lg border border-white/[0.04]">
              Film untuk "{query}" tidak ditemukan. Periksa ejaan atau coba judul lain.
            </div>
          )}
        </div>
      </div>
    )
  }

  if (view === 'all' || view === 'latest') {
    const title = view === 'latest' ? 'Film Terbaru' : 'Semua Rilisan'
    const movies = view === 'latest' ? moviesOnly : allMovies
    const loading = view === 'latest' ? latestLoad : allLoad

    return (
      <div className="pt-14">
        <SEO title={title} description={view === 'latest' ? 'Film terbaru yang tersedia.' : 'Koleksi lengkap film dan serial.'} />
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-white">{title}</h1>
          {loading ? (
            <MovieGridSkeleton />
          ) : movies.length > 0 ? (
            <MovieGrid title="" movies={movies} />
          ) : (
            <div className="text-center py-16 text-white/40 text-sm bg-cinema-900 rounded-lg border border-white/[0.04]">
              Film tidak ditemukan.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <SEO title="Film" description="Koleksi film lengkap dengan subtitle Indonesia." />
      {latestLoad ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Film Terbaru" movies={moviesOnly} />}
      {allLoad ? <MovieGridSkeleton /> : <MovieGrid title="Semua Rilisan" movies={allMovies} />}
      {comingLoad ? <MovieGridSkeleton count={3} /> : <ComingSoon movies={upcoming} />}
    </div>
  )
}
