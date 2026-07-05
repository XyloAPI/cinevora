import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMovieBySlug } from '@/hooks/useMovies'
import { IconArrowLeft, IconBrandYoutube } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'
import { getYoutubeEmbedUrl } from '@/lib/utils'
import * as tmdb from '@/lib/tmdb'

export default function TrailerPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: movie, isLoading } = useMovieBySlug(slug)
  const navigate = useNavigate()
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!movie) return
    if (movie.trailerUrl && getYoutubeEmbedUrl(movie.trailerUrl)) {
      setEmbedUrl(getYoutubeEmbedUrl(movie.trailerUrl)!)
      return
    }
    if (movie.tmdbId) {
      tmdb.getMovieVideos(movie.tmdbId).then((v) => {
        const url = tmdb.trailerUrl(v)
        if (url && getYoutubeEmbedUrl(url)) setEmbedUrl(getYoutubeEmbedUrl(url)!)
      }).catch(() => {})
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

  return (
    <div className="min-h-screen bg-cinema-950 text-white flex flex-col">
      <SEO title={`${movie.title} - Trailer`} description={movie.synopsis} url={`/trailer/${slug}`} />

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
          <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cinema-900 rounded-lg">
                <IconBrandYoutube size={48} className="text-white/20" />
                <p className="text-white/40 text-sm">No trailer available for this title</p>
                <Link to={`/movie/${slug}`} className="px-4 py-2 bg-cinema-red text-white text-sm rounded hover:bg-cinema-red-dark transition-colors">
                  Back to Details
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-white/50 flex-wrap">
            <span className="font-semibold text-white">{movie.title}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{movie.year}</span>
            {movie.quality && <><span className="w-1 h-1 rounded-full bg-white/20" /><span className="text-green-400">{movie.quality}</span></>}
            {movie.duration && <><span className="w-1 h-1 rounded-full bg-white/20" /><span>{movie.duration}</span></>}
          </div>
        </div>
      </div>
    </div>
  )
}
