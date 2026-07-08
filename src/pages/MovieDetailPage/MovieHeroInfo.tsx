import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft,
  IconStar,
  IconPlayerPlayFilled,
  IconBrandYoutube,
  IconDownload,
} from '@tabler/icons-react'
import type { Movie } from '@/types'
import { getDownloadUrl } from '@/lib/utils'

interface Company {
  name: string
  logoUrl?: string
}

interface MovieHeroInfoProps {
  movie: Movie
  slug: string
  logo: string | undefined
  trailer: string | undefined
  companies: Company[]
}

export default function MovieHeroInfo({
  movie,
  slug,
  logo,
  trailer,
  companies,
}: MovieHeroInfoProps) {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-[60vh] md:min-h-[70vh] flex items-end">
      <div className="absolute inset-0">
        <img src={movie.backdrop} alt="" fetchPriority="high" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/80 to-cinema-950/20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #0F0F0F 0%, #0F0F0F 35%, rgba(15, 15, 15, 0.95) 60%, rgba(15, 15, 15, 0.6) 80%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 pt-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-4 sm:mb-6"
        >
          <IconArrowLeft size={14} />
          Back
        </Link>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="hidden md:block w-[220px] lg:w-[260px] shrink-0">
            <img
              src={movie.poster}
              alt={movie.title}
              fetchPriority="high"
              className="w-full aspect-[2/3] rounded-xl object-cover shadow-2xl shadow-black/50"
            />
          </div>

          <div className="flex-1 min-w-0">
            {movie.quality && (
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 bg-cinema-red text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                  {movie.quality}
                </span>
                {movie.type === 'series' && (
                  <span className="px-2.5 py-0.5 bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                    Series
                  </span>
                )}
              </div>
            )}

            {logo ? (
              <div className="h-12 sm:h-16 lg:h-20 xl:h-24 mb-3 flex items-center">
                <img
                  src={logo}
                  alt={movie.title}
                  fetchPriority="high"
                  className="max-h-full max-w-[400px] w-auto object-contain"
                  style={{ filter: 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}
                />
              </div>
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight mb-3 leading-tight">
                {movie.title}
              </h1>
            )}

            <div className="flex items-center gap-3 text-[13px] text-white/50 flex-wrap mb-3">
              <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                <IconStar size={15} /> {movie.rating.toFixed(1)}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{movie.year}</span>
              {movie.duration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{movie.duration}</span>
                </>
              )}
              {movie.type === 'series' && movie.seasons && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>
                    {movie.seasons} Season{movie.seasons > 1 ? 's' : ''}
                    {movie.episodes ? ` · ${movie.episodes} Ep` : ''}
                  </span>
                </>
              )}
              {movie.status && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-green-400">{movie.status}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/30 mb-4 flex-wrap">
              {movie.genre.map((g: string, i: number) => (
                <span key={g} className="flex items-center gap-1">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-cinema-red/70 mr-1" />}
                  {g}
                </span>
              ))}
            </div>

            {movie.tagline && <p className="text-sm text-white/30 italic mb-2">"{movie.tagline}"</p>}

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
                <button
                  onClick={() => navigate(`/trailer/${slug}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white/80 font-medium rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/[0.06]"
                >
                  <IconBrandYoutube size={16} className="text-cinema-red" />
                  Trailer
                </button>
              )}
              {getDownloadUrl(movie.streamUrl) && (
                <a
                  href={getDownloadUrl(movie.streamUrl)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white/80 font-medium rounded-lg hover:bg-white/20 transition-colors text-sm border border-white/[0.06]"
                >
                  <IconDownload size={16} className="text-green-400" />
                  Download
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {companies
                .filter((c) => c.logoUrl)
                .slice(0, 5)
                .map((c) => (
                  <div key={c.name} className="h-8 flex items-center justify-center px-2" title={c.name}>
                    <img
                      src={c.logoUrl!}
                      alt={c.name}
                      loading="lazy"
                      className="max-h-6 max-w-[100px] object-contain"
                      style={{ filter: 'brightness(0) invert(0.7)' }}
                    />
                  </div>
                ))}
              {companies
                .filter((c) => !c.logoUrl)
                .slice(0, 3)
                .map((c) => (
                  <span key={c.name} className="text-[11px] text-white/30">
                    {c.name}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
