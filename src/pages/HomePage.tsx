import {
  useSeries,
  useLatestMovies,
  useAllMovies,
  useGenres,
  useComingSoon,
  useTrendingFromDb,
  useCategoryFromDb,
  usePlatformMoviesFromDb,
} from '@/hooks/useMovies'
import HeroCarousel from '@/components/sections/HeroCarousel'
import MovieRow from '@/components/sections/MovieRow'
import MovieGrid from '@/components/sections/MovieGrid'
import CategoriesGrid from '@/components/sections/CategoriesGrid'
import ComingSoon from '@/components/sections/ComingSoon'
import PlatformsRow from '@/components/sections/PlatformsRow'
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

  // Platform trending lists (Netflix, Disney+, Viu, Prime Video, HBO Max, Apple TV+)
  const { data: netflixTrending = [], isLoading: netflixLoad } = usePlatformMoviesFromDb(8)
  const { data: disneyTrending = [], isLoading: disneyLoad } = usePlatformMoviesFromDb(122)
  const { data: viuTrending = [], isLoading: viuLoad } = usePlatformMoviesFromDb(158)
  const { data: primeTrending = [], isLoading: primeLoad } = usePlatformMoviesFromDb(119)
  const { data: hboTrending = [], isLoading: hboLoad } = usePlatformMoviesFromDb(1899)
  const { data: appleTrending = [], isLoading: appleLoad } = usePlatformMoviesFromDb(350)

  return (
    <>
      <SEO />
      <HeroCarousel />
      
      {/* Platform quick links */}
      <PlatformsRow />
      
      {/* 1. Global Weekly Trending */}
      {trendingLoad ? <MovieRowSkeleton /> : <MovieRow title="Trending This Week" movies={trending} />}
      
      {/* 2. Trending di Indonesia */}
      {trendingIdLoad ? (
        <MovieRowSkeleton />
      ) : (
        trendingId.length > 0 && <MovieRow title="Trending di Indonesia" movies={trendingId} />
      )}

      {/* Netflix Row */}
      {netflixLoad ? (
        <MovieRowSkeleton />
      ) : (
        netflixTrending.length > 0 && (
          <MovieRow
            id="netflix-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <span className="text-[#E50914] font-black uppercase tracking-wider">Netflix</span>
              </span>
            }
            movies={netflixTrending}
          />
        )
      )}

      {/* Disney+ Row */}
      {disneyLoad ? (
        <MovieRowSkeleton />
      ) : (
        disneyTrending.length > 0 && (
          <MovieRow
            id="disney-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <span className="bg-gradient-to-r from-[#0063e5] to-[#30b9e3] bg-clip-text text-transparent font-extrabold">Disney+</span>
              </span>
            }
            movies={disneyTrending}
          />
        )
      )}

      {/* Viu Row */}
      {viuLoad ? (
        <MovieRowSkeleton />
      ) : (
        viuTrending.length > 0 && (
          <MovieRow
            id="viu-row"
            title={
              <span className="flex items-center gap-2">
                Drakor & Show Populer di <span className="text-[#FFC20E] font-extrabold uppercase tracking-wide">Viu</span>
              </span>
            }
            movies={viuTrending}
          />
        )
      )}

      {/* Prime Video Row */}
      {primeLoad ? (
        <MovieRowSkeleton />
      ) : (
        primeTrending.length > 0 && (
          <MovieRow
            id="prime-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <span className="text-[#00A8E1] font-black uppercase tracking-wider">Prime Video</span>
              </span>
            }
            movies={primeTrending}
          />
        )
      )}

      {/* HBO Max Row */}
      {hboLoad ? (
        <MovieRowSkeleton />
      ) : (
        hboTrending.length > 0 && (
          <MovieRow
            id="hbo-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <span className="bg-gradient-to-r from-[#9933FF] to-[#D500F9] bg-clip-text text-transparent font-extrabold uppercase tracking-wide">HBO Max</span>
              </span>
            }
            movies={hboTrending}
          />
        )
      )}

      {/* Apple TV+ Row */}
      {appleLoad ? (
        <MovieRowSkeleton />
      ) : (
        appleTrending.length > 0 && (
          <MovieRow
            id="apple-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <span className="text-white font-extrabold tracking-tight">Apple TV+</span>
              </span>
            }
            movies={appleTrending}
          />
        )
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
