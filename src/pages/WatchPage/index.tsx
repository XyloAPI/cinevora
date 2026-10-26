import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMovieBySlug, useSubtitle } from '@/hooks/useMovies'
import { IconPlayerPlayFilled, IconDownload } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'
import { VideoPlayer, EmbedPlayer } from '@/components/player'
import { buildDownloadUrl } from '@/lib/streamEndpoints'
import { isEmbedUrl } from '@/lib/embed'
import { playbackKey } from '@/lib/playbackPosition'
import { resolveActiveSource, resolveEpisodeSource } from '@/lib/streamUrls'
import WatchHeader from './WatchHeader'
import EpisodeSelector from './EpisodeSelector'

interface Episode {
  episode: number
  url: string
  url2?: string
}

interface Season {
  season: number
  episodes: Episode[]
}

export default function WatchPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: movie, isLoading } = useMovieBySlug(slug)

  const [activeSeason, setActiveSeason] = useState<number>(1)
  const [activeEpisode, setActiveEpisode] = useState<number>(1)
  const [activeServer, setActiveServer] = useState<'server1' | 'server2'>('server1')
  const [streamError, setStreamError] = useState(false)

  // Parse seasons and episodes if it's a TV series
  const isSeries = movie?.type === 'series'
  let seasonsList: Season[] = []
  if (isSeries && movie?.streamUrl && movie.streamUrl.trim().startsWith('[')) {
    try {
      seasonsList = JSON.parse(movie.streamUrl)
    } catch (e) {
      console.error('Failed to parse seasons list JSON', e)
    }
  }

  const subtitleSeason = isSeries ? activeSeason : 0
  const subtitleEpisode = isSeries ? activeEpisode : 0
  const { data: subtitleRow } = useSubtitle(movie?.id, subtitleSeason, subtitleEpisode)

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
          <Link to="/" className="text-cinema-red hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Resolve available stream URLs (shared logic with the backend proxy)
  const primary = resolveEpisodeSource({
    streamUrl: movie.streamUrl,
    streamUrl2: movie.streamUrl2,
    season: activeSeason,
    episode: activeEpisode,
    slot: 1,
  })
  const mirror = resolveEpisodeSource({
    streamUrl: movie.streamUrl,
    streamUrl2: movie.streamUrl2,
    season: activeSeason,
    episode: activeEpisode,
    slot: 2,
  })

  const hasServer2 = Boolean(mirror)
  const currentStreamUrl =
    resolveActiveSource({ primary, mirror, preferMirror: activeServer === 'server2' }) || ''

  const subtitle = subtitleRow
    ? {
        url: subtitleRow.url,
        lang: subtitleRow.lang,
        label: subtitleRow.label,
        kind: subtitleRow.kind,
        version: subtitleRow.updated_at || subtitleRow.url,
      }
    : null

  return (
    <div className="min-h-screen bg-cinema-950 text-white flex flex-col">
      <SEO title={`Watch ${movie.title}`} description={movie.synopsis} url={`/watch/${slug}`} movie={movie} />

      {/* Header - Subcomponent */}
      <WatchHeader movie={movie} slug={slug} />

      <div className="flex-1 flex items-start justify-center bg-black/50 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          {streamError && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-cinema-red/30 bg-cinema-red/10 px-3 py-2 text-xs text-white/70">
              <IconPlayerPlayFilled size={14} className="text-cinema-red" />
              Gagal memuat video. Coba server lain atau cek URL video Anda.
            </div>
          )}

          {currentStreamUrl ? (
            isEmbedUrl(currentStreamUrl) ? (
              <EmbedPlayer src={currentStreamUrl} title={movie.title} />
            ) : (
              <VideoPlayer
                key={currentStreamUrl}
                src={currentStreamUrl}
                title={movie.title}
                movieId={movie.id}
                season={subtitleSeason}
                episode={subtitleEpisode}
                storageKey={playbackKey(slug, subtitleSeason, subtitleEpisode)}
                subtitle={subtitle}
                onError={() => setStreamError(true)}
              />
            )
          ) : (
            <div className="relative w-full aspect-video flex flex-col items-center justify-center gap-4 bg-cinema-900 rounded-lg">
              <IconPlayerPlayFilled size={48} className="text-white/20 animate-pulse" />
              <p className="text-white/40 text-sm">
                {isSeries
                  ? `No stream URL set for Season ${activeSeason} Episode ${activeEpisode}`
                  : 'No stream available for this title'}
              </p>
              <Link
                to={`/movie/${slug}`}
                className="px-4 py-2 bg-cinema-red text-white text-sm rounded hover:bg-cinema-red-dark transition-colors"
              >
                Back to Details
              </Link>
            </div>
          )}

          {/* Server Switcher (Only visible if Server 2 is available) */}
          {hasServer2 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Server:</span>
              <div className="inline-flex rounded-lg bg-cinema-900/80 p-1 border border-white/[0.06] gap-1">
                <button
                  type="button"
                  onClick={() => setActiveServer('server1')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeServer === 'server1' || !hasServer2
                      ? 'bg-cinema-red text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Server 1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveServer('server2')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeServer === 'server2' && hasServer2
                      ? 'bg-cinema-red text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Server 2
                </button>
              </div>
            </div>
          )}

          {/* Episode & Season Selector for TV Series - Subcomponent */}
          {isSeries && seasonsList.length > 0 && (
            <EpisodeSelector
              seasonsList={seasonsList}
              activeSeason={activeSeason}
              setActiveSeason={setActiveSeason}
              activeEpisode={activeEpisode}
              setActiveEpisode={setActiveEpisode}
            />
          )}

          <div className="mt-4 flex items-center gap-3 text-sm text-white/50 flex-wrap">
            <span className="font-semibold text-white">{movie.title}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{movie.year}</span>
            {isSeries ? (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-purple-400">
                  Season {activeSeason} Episode {activeEpisode}
                </span>
              </>
            ) : (
              movie.quality && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-green-400">{movie.quality}</span>
                </>
              )
            )}
            {movie.duration && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{movie.duration}</span>
              </>
            )}
            {currentStreamUrl && (
              <a
                href={buildDownloadUrl({
                  movieId: movie.id,
                  slot: activeServer === 'server2' && hasServer2 ? 2 : 1,
                  season: subtitleSeason,
                  episode: subtitleEpisode,
                })}
                className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white/70 text-xs rounded hover:bg-white/20 transition-colors"
              >
                <IconDownload size={14} className="text-green-400" /> Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
