import { IconArrowLeft } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Movie } from '@/types'

interface WatchHeaderProps {
  movie: Movie
  slug: string
}

export default function WatchHeader({ movie, slug }: WatchHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 shrink-0 bg-cinema-950/95 backdrop-blur-md border-b border-white/[0.04]">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors"
        >
          <IconArrowLeft size={14} /> Back
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Link to={`/movie/${slug}`} className="text-sm text-white/50 hover:text-white transition-colors truncate max-w-[200px]">
          {movie.title}
        </Link>
      </div>
    </header>
  )
}
