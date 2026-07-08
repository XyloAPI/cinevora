import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMovieBySlug } from '@/hooks/useMovies'
import { IconArrowLeft, IconPlayerPlayFilled, IconDownload } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'
import { getDownloadUrl } from '@/lib/utils'

interface Episode {
  episode: number
  url: string
}

interface Season {
  season: number
  episodes: Episode[]
}

export default function WatchPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: movie, isLoading } = useMovieBySlug(slug)
  const navigate = useNavigate()

  const [activeSeason, setActiveSeason] = useState<number>(1)
  const [activeEpisode, setActiveEpisode] = useState<number>(1)

  // Parse seasons and episodes if it's a TV series
  const isSeries = movie?.type === 'series'
  let seasonsList: Season[] = []
  if (isSeries && movie?.streamUrl && movie.streamUrl.trim().startsWith('[')) {
    try {
      seasonsList = JSON.parse(movie.streamUrl)
    } catch (e) {
      console.error("Failed to parse seasons list JSON", e)
    }
  }

  // Set initial active season/episode when movie loads
  useEffect(() => {
    if (isSeries && seasonsList.length > 0) {
      const firstSeason = seasonsList[0]
      setActiveSeason(firstSeason.season)
      if (firstSeason.episodes.length > 0) {
        setActiveEpisode(firstSeason.episodes[0].episode)
      }
    }
  }, [movie])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cinema-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cinema-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-cinema-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-bold mb-2">Movie not found</h1>
          <Link to="/" className="text-cinema-red hover:underline text-sm">Back to Home</Link>
        </div>
      </div>
    )
  }

  // Resolve current active stream URL
  let currentStreamUrl = movie.streamUrl || ''
  if (isSeries && seasonsList.length > 0) {
    const seasonObj = seasonsList.find((s) => s.season === activeSeason)
    const episodeObj = seasonObj?.episodes.find((e) => e.episode === activeEpisode)
    currentStreamUrl = episodeObj?.url || ''
  }

  const activeSeasonData = seasonsList.find((s) => s.season === activeSeason)

  return (
    <div className="min-h-screen bg-cinema-950 text-white flex flex-col">
      <SEO title={`Watch ${movie.title}`} description={movie.synopsis} url={`/watch/${slug}`} movie={movie} />

      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 shrink-0 bg-cinema-950/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors">
            <IconArrowLeft size={14} /> Back
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/movie/${slug}`} className="text-sm text-white/50 hover:text-white transition-colors truncate max-w-[200px]">
            {movie.title}
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center bg-black/50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {currentStreamUrl ? (
              <iframe
                src={currentStreamUrl}
                className="absolute inset-0 w-full h-full rounded-lg bg-black"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cinema-900 rounded-lg">
                <IconPlayerPlayFilled size={48} className="text-white/20 animate-pulse" />
                <p className="text-white/40 text-sm">
                  {isSeries
                    ? `No stream URL set for Season ${activeSeason} Episode ${activeEpisode}`
                    : 'No stream available for this title'}
                </p>
                <Link to={`/movie/${slug}`} className="px-4 py-2 bg-cinema-red text-white text-sm rounded hover:bg-cinema-red-dark transition-colors">
                  Back to Details
                </Link>
              </div>
            )}
          </div>

          {/* Episode & Season Selector for TV Series */}
          {isSeries && seasonsList.length > 0 && (
            <div className="mt-6 bg-cinema-900/60 backdrop-blur border border-white/[0.05] rounded-xl p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                {/* Seasons Tab */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.05]">
                  <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider shrink-0 mr-2">Seasons:</span>
                  {seasonsList.map((s) => (
                    <button
                      key={s.season}
                      onClick={() => {
                        setActiveSeason(s.season)
                        // Reset to first episode of selected season
                        if (s.episodes.length > 0) {
                          setActiveEpisode(s.episodes[0].episode)
                        }
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                        activeSeason === s.season
                          ? 'bg-cinema-red text-white shadow-lg shadow-cinema-red/20'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Season {s.season}
                    </button>
                  ))}
                </div>

                {/* Episodes Grid */}
                {activeSeasonData && (
                  <div>
                    <span className="block text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">Episodes:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {activeSeasonData.episodes.map((ep) => (
                        <button
                          key={ep.episode}
                          onClick={() => setActiveEpisode(ep.episode)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 border ${
                            activeEpisode === ep.episode
                              ? 'bg-cinema-red/10 border-cinema-red text-cinema-red font-semibold'
                              : ep.url
                              ? 'bg-white/5 border-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white'
                              : 'bg-white/[0.02] border-white/[0.02] text-white/30 cursor-not-allowed hover:bg-white/5'
                          }`}
                        >
                          <span className="text-[10px] opacity-60">EP</span>
                          <span className="text-sm">{ep.episode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 text-sm text-white/50 flex-wrap">
            <span className="font-semibold text-white">{movie.title}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{movie.year}</span>
            {isSeries ? (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-purple-400">Season {activeSeason} Episode {activeEpisode}</span>
              </>
            ) : (
              movie.quality && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-green-400">{movie.quality}</span>
                </>
              )
            )}
            {movie.duration && <><span className="w-1 h-1 rounded-full bg-white/20" /><span>{movie.duration}</span></>}
            {getDownloadUrl(currentStreamUrl) && (
              <a href={getDownloadUrl(currentStreamUrl)!} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/70 text-xs rounded hover:bg-white/20 transition-colors">
                <IconDownload size={14} className="text-green-400" /> Download
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
