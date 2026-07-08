import type { TmdbMovieResult } from '@/types'

interface SearchResultsProps {
  tmdbResults: TmdbMovieResult[]
  tmdbImporting: Set<number>
  existingTmdbIds: Set<number>
  importFromTmdb: (tmdbId: number) => Promise<void>
}

export default function SearchResults({
  tmdbResults,
  tmdbImporting,
  existingTmdbIds,
  importFromTmdb,
}: SearchResultsProps) {
  if (tmdbResults.length === 0) return null

  return (
    <div className="mb-4">
      <p className="text-[11px] text-white/30 mb-2">Search results ({tmdbResults.length})</p>
      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {tmdbResults.map((m) => (
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
    </div>
  )
}
