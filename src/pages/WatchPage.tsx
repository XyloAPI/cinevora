import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMovieBySlug } from '@/hooks/useMovies'
import { IconArrowLeft, IconPlayerPlayFilled, IconDownload } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'
import { getDownloadUrl } from '@/lib/utils'

export default function WatchPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: movie, isLoading } = useMovieBySlug(slug)
  const navigate = useNavigate()

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
            {movie.streamUrl ? (
              <iframe
                src={movie.streamUrl}
                className="absolute inset-0 w-full h-full rounded-lg"
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cinema-900 rounded-lg">
                <IconPlayerPlayFilled size={48} className="text-white/20" />
                <p className="text-white/40 text-sm">No stream available for this title</p>
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
            {getDownloadUrl(movie.streamUrl) && (
              <a href={getDownloadUrl(movie.streamUrl)!} target="_blank" rel="noopener noreferrer"
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
