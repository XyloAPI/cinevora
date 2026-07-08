import { IconTrendingUp } from '@tabler/icons-react'
import type { TmdbMovieResult } from '@/types'

interface DiscoverListProps {
  tmdbCategory: 'trending' | 'now_playing' | 'popular' | 'top_rated'
  setTmdbCategory: (val: 'trending' | 'now_playing' | 'popular' | 'top_rated') => void
  tmdbRegion: string
  setTmdbRegion: (val: string) => void
  loadingCategoryMovies: boolean
  tmdbTrending: TmdbMovieResult[]
  existingTmdbIds: Set<number>
  importFromTmdb: (tmdbId: number) => Promise<void>
  tmdbImporting: Set<number>
}

export default function DiscoverList({
  tmdbCategory,
  setTmdbCategory,
  tmdbRegion,
  setTmdbRegion,
  loadingCategoryMovies,
  tmdbTrending,
  existingTmdbIds,
  importFromTmdb,
  tmdbImporting,
}: DiscoverListProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 flex-wrap">
        <p className="text-[11px] text-white/30 flex items-center gap-1">
          <IconTrendingUp size={12} /> Discover List
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={tmdbCategory}
            onChange={(e) => setTmdbCategory(e.target.value as any)}
            className="bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none"
          >
            <option value="trending">Trending</option>
            <option value="now_playing">Now Playing</option>
            <option value="popular">Popular</option>
            <option value="top_rated">Top Rated</option>
          </select>
          <select
            value={tmdbRegion}
            onChange={(e) => setTmdbRegion(e.target.value)}
            className="bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none"
          >
            <option value="">Global</option>
            <option value="ID">Indonesia</option>
            <option value="US">United States</option>
            <option value="KR">South Korea</option>
            <option value="JP">Japan</option>
            <option value="GB">United Kingdom</option>
          </select>
        </div>
      </div>

      {loadingCategoryMovies ? (
        <div className="text-[11px] text-white/40 py-4 text-center animate-pulse">Loading movies...</div>
      ) : tmdbTrending.length === 0 ? (
        <div className="text-[11px] text-white/30 py-4 text-center">No movies found in this list</div>
      ) : (
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          {tmdbTrending.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-[12px] bg-cinema-800/50 rounded px-2 py-1.5 border border-white/[0.02]">
              <div className="w-6 h-9 rounded overflow-hidden bg-cinema-800 shrink-0">
                {m.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${m.poster_path}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="flex-1 truncate">
                {m.title || m.name}{' '}
                <span className="text-white/30">
                  ({(m.release_date || m.first_air_date)?.slice(0, 4) || '—'})
                </span>
              </span>
              <span className="text-yellow-400/70 text-[10px]">{(m.vote_average ?? 0).toFixed(1)}</span>
              {existingTmdbIds.has(m.id) ? (
                <span className="px-2 py-0.5 bg-white/5 text-white/30 text-[10px] rounded">In DB</span>
              ) : (
                <button
                  onClick={() => importFromTmdb(m.id)}
                  disabled={tmdbImporting.has(m.id)}
                  className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 disabled:opacity-50"
                >
                  {tmdbImporting.has(m.id) ? '...' : 'Import'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
