import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import { IconPlayerPlayFilled, IconArrowLeft, IconStar, IconBrandYoutube, IconDownload, IconExternalLink } from '@tabler/icons-react'
import { useMovieBySlug, useRelatedMovies } from '@/hooks/useMovies'
import MovieRow from '@/components/sections/MovieRow'
import SEO from '@/components/shared/SEO'
import * as tmdb from '@/lib/tmdb'
import { getDownloadUrl, getYoutubeEmbedUrl } from '@/lib/utils'

export default function MovieDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: movie } = useMovieBySlug(slug)
  const { data: related = [] } = useRelatedMovies(movie ?? null)
  const [logo, setLogo] = useState<string | undefined>(movie?.logoUrl)
  const [cast, setCast] = useState<{ id: number; name: string; character: string; photo: string | undefined }[]>([])
  const [companies, setCompanies] = useState<{ name: string; logoUrl?: string }[]>([])
  const [trailer, setTrailer] = useState<string | undefined>()

  useEffect(() => {
    setLogo(movie?.logoUrl)
    if (!movie?.tmdbId) return
    const id = movie.tmdbId
    if (!movie?.logoUrl) {
      tmdb.fetchMovieImages(id).then(({ logos }) => setLogo(tmdb.logoUrl(logos))).catch(() => {})
    }
    tmdb.getMovieCredits(id).then((c) => setCast(tmdb.castWithPhotos(c))).catch(() => {})
    tmdb.getMovieVideos(id).then((v) => setTrailer(tmdb.trailerUrl(v))).catch(() => {})
    tmdb.getMovieDetail(id).then((d) => {
      setCompanies(
        d.production_companies.map((c) => ({
          name: c.name,
          logoUrl: c.logo_path ? `https://image.tmdb.org/t/p/w200${c.logo_path}` : undefined,
        }))
      )
    }).catch(() => {})
  }, [movie?.tmdbId])

  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scroll: 0 })

  function handleMouseDown(e: React.MouseEvent) {
    if (!scrollRef.current) return
    setIsDragging(true)
    dragStart.current = { x: e.pageX, scroll: scrollRef.current.scrollLeft }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const dx = e.pageX - dragStart.current.x
    scrollRef.current.scrollLeft = dragStart.current.scroll - dx
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Movie not found</h1>
          <Link to="/" className="text-cinema-red hover:underline text-sm">Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO
        title={movie.title}
        description={movie.synopsis}
        image={movie.backdrop}
        url={`/movie/${slug}`}
      />

      <div className="relative min-h-[60vh] md:min-h-[70vh] flex items-end">
        <div className="absolute inset-0">
          <img src={movie.backdrop} alt="" fetchPriority="high" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/80 to-cinema-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/95 via-cinema-950/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-4 sm:mb-6">
            <IconArrowLeft size={14} />
            Back
          </Link>

          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0">
              <img src={movie.poster} alt={movie.title} fetchPriority="high" className="w-full aspect-[2/3] rounded-xl object-cover shadow-2xl shadow-black/50" />
            </div>

            <div className="flex-1 min-w-0">
              {movie.quality && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-cinema-red text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">{movie.quality}</span>
                  {movie.type === 'series' && (
                    <span className="px-2.5 py-0.5 bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">Series</span>
                  )}
                </div>
              )}

              {logo ? (
                <div className="h-12 sm:h-16 lg:h-20 xl:h-24 mb-3 flex items-center">
                  <img src={logo} alt={movie.title} fetchPriority="high" className="max-h-full max-w-[400px] w-auto object-contain" style={{ filter: 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">{movie.title}</h1>
              )}

              <div className="flex items-center gap-3 text-[13px] text-white/50 flex-wrap mb-3">
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <IconStar size={15} /> {movie.rating.toFixed(1)}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{movie.year}</span>
                {movie.duration && <><span className="w-1 h-1 rounded-full bg-white/20" /><span>{movie.duration}</span></>}
                {movie.type === 'series' && movie.seasons && (
                  <><span className="w-1 h-1 rounded-full bg-white/20" /><span>{movie.seasons} Season{movie.seasons > 1 ? 's' : ''}{movie.episodes ? ` · ${movie.episodes} Ep` : ''}</span></>
                )}
                {movie.status && <><span className="w-1 h-1 rounded-full bg-white/20" /><span className="text-green-400">{movie.status}</span></>}
              </div>

              <div className="flex items-center gap-2 text-xs text-white/30 mb-4 flex-wrap">
                {movie.genre.map((g: string, i: number) => (
                  <span key={g} className="flex items-center gap-1">
                    {i > 0 && <span className="w-1 h-1 rounded-full bg-cinema-red/70 mr-1" />}
                    {g}
                  </span>
                ))}
              </div>

              {movie.tagline && (
                <p className="text-sm text-white/30 italic mb-2">"{movie.tagline}"</p>
              )}

              <p className="text-sm text-white/60 leading-relaxed max-w-2xl mb-5">{movie.synopsis}</p>

              <div className="flex items-center gap-3 flex-wrap mb-6">
                <button
                  onClick={() => navigate(`/watch/${slug}`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-cinema-red text-white font-semibold rounded-lg hover:bg-cinema-red-dark transition-colors text-sm shadow-lg shadow-cinema-red/25"
                >
                  <IconPlayerPlayFilled size={16} />
                  {movie.streamUrl ? 'Watch Now' : 'Play Now'}
                </button>
                {trailer && (
                  <button onClick={() => navigate(`/trailer/${slug}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white/80 font-medium rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/[0.06]">
                    <IconBrandYoutube size={16} className="text-cinema-red" />
                    Trailer
                  </button>
                )}
                {getDownloadUrl(movie.streamUrl) && (
                  <a href={getDownloadUrl(movie.streamUrl)!} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white/80 font-medium rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/[0.06]">
                    <IconDownload size={16} className="text-green-400" />
                    Download
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {companies.filter((c) => c.logoUrl).slice(0, 5).map((c) => (
                  <div key={c.name} className="h-8 flex items-center justify-center px-2" title={c.name}>
                    <img src={c.logoUrl!} alt={c.name} loading="lazy" className="max-h-6 max-w-[100px] object-contain" style={{ filter: 'brightness(0) invert(0.7)' }} />
                  </div>
                ))}
                {companies.filter((c) => !c.logoUrl).slice(0, 3).map((c) => (
                  <span key={c.name} className="text-[11px] text-white/30">{c.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {cast.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-base font-bold mb-5 flex items-center gap-2">
            <IconStar size={16} className="text-cinema-red" /> Cast
          </h2>
          <div ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex gap-4 sm:gap-6 overflow-x-auto cursor-grab active:cursor-grabbing select-none scroll-hidden"
          >
            {cast.map((c) => (
              <div key={c.id} className="flex flex-col items-center text-center shrink-0 w-24 sm:w-28">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-cinema-800 border-2 border-white/[0.06] mb-2">
                  {c.photo ? (
                    <img src={c.photo} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold">
                      {c.name.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="text-[12px] font-medium leading-tight truncate w-full">{c.name}</p>
                <p className="text-[10px] text-white/30 truncate w-full">{c.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-10">
        <MovieRow title="Related Movies" movies={related} />
      </section>
    </div>
  )
}
