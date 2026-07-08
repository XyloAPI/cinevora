import { IconMovie, IconSearch } from '@tabler/icons-react'
import type { TmdbMovieResult } from '@/types'
import SearchResults from './SearchResults'
import DiscoverList from './DiscoverList'

interface TmdbPanelProps {
  tmdbSearch: string
  setTmdbSearch: (val: string) => void
  tmdbSearching: boolean
  tmdbResults: TmdbMovieResult[]
  tmdbTrending: TmdbMovieResult[]
  tmdbImporting: Set<number>
  existingTmdbIds: Set<number>
  importFromTmdb: (tmdbId: number) => Promise<void>
  handleTmdbSearch: () => void
  setShowTmdbPanel: (val: boolean) => void
  tmdbCategory: 'trending' | 'now_playing' | 'popular' | 'top_rated'
  setTmdbCategory: (val: 'trending' | 'now_playing' | 'popular' | 'top_rated') => void
  tmdbRegion: string
  setTmdbRegion: (val: string) => void
  loadingCategoryMovies: boolean
  tmdbType: 'movie' | 'series'
  setTmdbType: (val: 'movie' | 'series') => void
}

export default function TmdbPanel({
  tmdbSearch,
  setTmdbSearch,
  tmdbSearching,
  tmdbResults,
  tmdbTrending,
  tmdbImporting,
  existingTmdbIds,
  importFromTmdb,
  handleTmdbSearch,
  setShowTmdbPanel,
  tmdbCategory,
  setTmdbCategory,
  tmdbRegion,
  setTmdbRegion,
  loadingCategoryMovies,
  tmdbType,
  setTmdbType,
}: TmdbPanelProps) {
  return (
    <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <IconMovie size={14} className="text-cinema-red" /> TMDB Import
        </h3>
        <button onClick={() => setShowTmdbPanel(false)} className="text-[11px] text-white/30 hover:text-white">
          Close
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <select
          value={tmdbType}
          onChange={(e) => setTmdbType(e.target.value as 'movie' | 'series')}
          className="bg-cinema-800 text-white text-[12px] px-2 py-1.5 rounded border border-white/[0.06] outline-none"
        >
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
        <input
          value={tmdbSearch}
          onChange={(e) => setTmdbSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
          placeholder={tmdbType === 'series' ? 'Search TMDB series...' : 'Search TMDB movies...'}
          className="flex-1 bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
        />
        <button
          onClick={handleTmdbSearch}
          disabled={tmdbSearching}
          className="px-3 py-1.5 bg-cinema-red text-white text-[12px] rounded hover:bg-cinema-red-dark disabled:opacity-50 flex items-center gap-1"
        >
          <IconSearch size={13} /> {tmdbSearching ? '...' : 'Search'}
        </button>
      </div>

      {/* TMDB Search Results - Subcomponent */}
      <SearchResults
        tmdbResults={tmdbResults}
        tmdbImporting={tmdbImporting}
        existingTmdbIds={existingTmdbIds}
        importFromTmdb={importFromTmdb}
      />

      {/* Discover List - Subcomponent */}
      <DiscoverList
        tmdbCategory={tmdbCategory}
        setTmdbCategory={setTmdbCategory}
        tmdbRegion={tmdbRegion}
        setTmdbRegion={setTmdbRegion}
        loadingCategoryMovies={loadingCategoryMovies}
        tmdbTrending={tmdbTrending}
        existingTmdbIds={existingTmdbIds}
        importFromTmdb={importFromTmdb}
        tmdbImporting={tmdbImporting}
      />
    </div>
  )
}
