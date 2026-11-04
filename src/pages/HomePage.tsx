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

const platformLogoSizes: Record<string, { width: number; height: number }> = {
  netflix: { width: 65, height: 32 },
  hotstar: { width: 80, height: 32 },
  viu: { width: 45, height: 32 },
  prime: { width: 120, height: 32 },
  hbomax: { width: 100, height: 32 },
  appletv: { width: 45, height: 32 },
  iqiyi: { width: 50, height: 32 },
  crunchyroll: { width: 130, height: 32 },
  wetv: { width: 80, height: 32 },
  vidio: { width: 80, height: 57 },
  klikfilm: { width: 70, height: 32 },
  visionplus: { width: 86, height: 24 },
}

function PlatformLogo({ file, name }: { file: string; name: string }) {
  const size = platformLogoSizes[file]

  return (
    <img
      src={`/assets/platforms/${file}.svg`}
      alt={name}
      width={size.width}
      height={size.height}
      className="shrink-0 object-contain object-left"
    />
  )
}

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
  const { data: iqiyiTrending = [], isLoading: iqiyiLoad } = usePlatformMoviesFromDb(581, 'US')
  const { data: crunchyrollTrending = [], isLoading: crunchyrollLoad } = usePlatformMoviesFromDb(283)
  const { data: wetvTrending = [], isLoading: wetvLoad } = usePlatformMoviesFromDb(623)
  const { data: vidioTrending = [], isLoading: vidioLoad } = usePlatformMoviesFromDb(489)
  const { data: klikfilmTrending = [], isLoading: klikfilmLoad } = usePlatformMoviesFromDb(576)
  const { data: visionplusTrending = [], isLoading: visionplusLoad } = usePlatformMoviesFromDb(5756)
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
                Populer di <PlatformLogo file="netflix" name="Netflix" />
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
                Populer di <PlatformLogo file="hotstar" name="Disney+ Hotstar" />
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
                Drakor & Show Populer di <PlatformLogo file="viu" name="Viu" />
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
                Populer di <PlatformLogo file="prime" name="Prime Video" />
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
                Populer di <PlatformLogo file="hbomax" name="HBO Max" />
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
                Populer di <PlatformLogo file="appletv" name="Apple TV+" />
              </span>
            }
            movies={appleTrending}
          />
        )
      )}

      {/* iQIYI Row */}
      {iqiyiLoad ? (
        <MovieRowSkeleton />
      ) : (
        iqiyiTrending.length > 0 && (
          <MovieRow
            id="iqiyi-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="iqiyi" name="iQIYI" />
              </span>
            }
            movies={iqiyiTrending}
          />
        )
      )}

      {/* Crunchyroll Row */}
      {crunchyrollLoad ? (
        <MovieRowSkeleton />
      ) : (
        crunchyrollTrending.length > 0 && (
          <MovieRow
            id="crunchyroll-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="crunchyroll" name="Crunchyroll" />
              </span>
            }
            movies={crunchyrollTrending}
          />
        )
      )}

      {/* WeTV Row */}
      {wetvLoad ? (
        <MovieRowSkeleton />
      ) : (
        wetvTrending.length > 0 && (
          <MovieRow
            id="wetv-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="wetv" name="WeTV" />
              </span>
            }
            movies={wetvTrending}
          />
        )
      )}

      {/* Vidio Row */}
      {vidioLoad ? (
        <MovieRowSkeleton />
      ) : (
        vidioTrending.length > 0 && (
          <MovieRow
            id="vidio-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="vidio" name="Vidio" />
              </span>
            }
            movies={vidioTrending}
          />
        )
      )}

      {/* KlikFilm Row */}
      {klikfilmLoad ? (
        <MovieRowSkeleton />
      ) : (
        klikfilmTrending.length > 0 && (
          <MovieRow
            id="klikfilm-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="klikfilm" name="KlikFilm" />
              </span>
            }
            movies={klikfilmTrending}
          />
        )
      )}

      {/* Vision+ Row */}
      {visionplusLoad ? (
        <MovieRowSkeleton />
      ) : (
        visionplusTrending.length > 0 && (
          <MovieRow
            id="visionplus-row"
            title={
              <span className="flex items-center gap-2">
                Populer di <PlatformLogo file="visionplus" name="Vision+" />
              </span>
            }
            movies={visionplusTrending}
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
