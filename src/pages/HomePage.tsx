import {
  useSeries,
  useLatestMovies,
  useAllMovies,
  useGenres,
  useComingSoon,
  useTrendingFromDb,
  useCategoryFromDb,
} from '@/hooks/useMovies'
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
  
  const { data: trending = [], isLoading: trendingLoad } = useTrendingFromDb()
  const { data: trendingId = [], isLoading: trendingIdLoad } = useCategoryFromDb('trending', 'ID')
  const { data: nowPlaying = [], isLoading: nowPlayingLoad } = useCategoryFromDb('now_playing')
  const { data: popular = [], isLoading: popularLoad } = useCategoryFromDb('popular')
  const { data: topRated = [], isLoading: topRatedLoad } = useCategoryFromDb('top_rated')

  return (
    <>
      <SEO />
      <HeroCarousel />
      
      {/* 1. Global Weekly Trending */}
      {trendingLoad ? <MovieRowSkeleton /> : <MovieRow title="Trending This Week" movies={trending} />}
      
      {/* 2. Trending di Indonesia */}
      {trendingIdLoad ? (
        <MovieRowSkeleton />
      ) : (
        trendingId.length > 0 && <MovieRow title="Trending di Indonesia" movies={trendingId} />
      )}

      {/* 3. Sedang Tayang di Bioskop */}
      {nowPlayingLoad ? (
        <MovieRowSkeleton />
      ) : (
        nowPlaying.length > 0 && <MovieRow title="Sedang Tayang di Bioskop" movies={nowPlaying} />
      )}

      {/* 4. Film Terpopuler */}
      {popularLoad ? (
        <MovieRowSkeleton />
      ) : (
        popular.length > 0 && <MovieRow title="Film Terpopuler" movies={popular} />
      )}

      {/* 5. Rating Tertinggi */}
      {topRatedLoad ? (
        <MovieRowSkeleton />
      ) : (
        topRated.length > 0 && <MovieRow title="Rating Tertinggi" movies={topRated} />
      )}

      {/* 6. Latest Movies */}
      {moviesLoad ? <MovieGridSkeleton count={6} /> : <MovieGrid title="Latest Movies" movies={moviesOnly} />}
      
      {/* 7. Popular Series */}
      {seriesLoad ? <MovieRowSkeleton /> : <MovieRow title="Popular Series" movies={series} />}
      
      {/* 8. Genres / Categories Grid */}
      {genresLoad ? <MovieGridSkeleton count={8} /> : <CategoriesGrid genres={genres} />}
      
      {/* 9. All Releases */}
      {allLoad ? <MovieGridSkeleton /> : <MovieGrid title="All Releases" movies={allMovies} />}
      
      {/* 10. Coming Soon */}
      {comingLoad ? <MovieGridSkeleton count={3} /> : <ComingSoon movies={upcoming} />}
    </>
  )
}
