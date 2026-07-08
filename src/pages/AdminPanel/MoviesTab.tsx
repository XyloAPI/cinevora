import React from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconBrandYoutube,
  IconWorld,
} from '@tabler/icons-react'
import type { Movie, TmdbMovieResult } from '@/types'
import TmdbPanel from '@/components/admin/TmdbPanel'
import MovieForm from '@/components/admin/MovieForm'

interface MoviesTabProps {
  movieFilter: string
  setMovieFilter: (v: string) => void
  jsonView: boolean
  setJsonView: (v: boolean) => void
  showTmdbPanel: boolean
  setShowTmdbPanel: (v: boolean) => void
  openAddForm: () => void
  openEditForm: (m: Movie) => void
  handleDelete: (id: string) => void
  paginated: Movie[]
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
  filtered: Movie[]
  existingTmdbIds: Set<number>
  importFromTmdb: (id: number) => Promise<void>
  handleTmdbSearch: () => void
  tmdbSearch: string
  setTmdbSearch: (v: string) => void
  tmdbSearching: boolean
  tmdbResults: TmdbMovieResult[]
  tmdbTrending: TmdbMovieResult[]
  tmdbImporting: Set<number>
  tmdbCategory: 'trending' | 'now_playing' | 'popular' | 'top_rated'
  setTmdbCategory: (v: 'trending' | 'now_playing' | 'popular' | 'top_rated') => void
  tmdbRegion: string
  setTmdbRegion: (v: string) => void
  loadingCategoryMovies: boolean
  tmdbType: 'movie' | 'series'
  setTmdbType: (v: 'movie' | 'series') => void
  editingMovie: Partial<Movie> | null
  localMovies: Movie[]
  closeForm: () => void
  refetch: () => void
}

export default function MoviesTab({
  movieFilter,
  setMovieFilter,
  jsonView,
  setJsonView,
  showTmdbPanel,
  setShowTmdbPanel,
  openAddForm,
  openEditForm,
  handleDelete,
  paginated,
  page,
  setPage,
  totalPages,
  filtered,
  existingTmdbIds,
  importFromTmdb,
  handleTmdbSearch,
  tmdbSearch,
  setTmdbSearch,
  tmdbSearching,
  tmdbResults,
  tmdbTrending,
  tmdbImporting,
  tmdbCategory,
  setTmdbCategory,
  tmdbRegion,
  setTmdbRegion,
  loadingCategoryMovies,
  tmdbType,
  setTmdbType,
  editingMovie,
  localMovies,
  closeForm,
  refetch,
}: MoviesTabProps) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold">Movie Manager</h2>
        <div className="flex items-center gap-2">
          <input
            value={movieFilter}
            onChange={(e) => setMovieFilter(e.target.value)}
            placeholder="Filter movies..."
            className="bg-cinema-900 text-white text-[12px] px-3 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 w-44"
          />
          <button
            onClick={() => setJsonView(!jsonView)}
            className={`px-3 py-1.5 rounded text-[12px] border transition-colors ${
              jsonView ? 'bg-white/10 border-white/20 text-white' : 'border-white/[0.06] text-white/60 hover:bg-white/5'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setShowTmdbPanel(!showTmdbPanel)}
            className="px-3 py-1.5 bg-cinema-red/10 text-cinema-red text-[12px] font-medium rounded hover:bg-cinema-red/20"
          >
            TMDB
          </button>
          <button
            onClick={openAddForm}
            className="px-3 py-1.5 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark"
          >
            Add New
          </button>
        </div>
      </div>

      {showTmdbPanel && (
        <TmdbPanel
          tmdbSearch={tmdbSearch}
          setTmdbSearch={setTmdbSearch}
          tmdbSearching={tmdbSearching}
          tmdbResults={tmdbResults}
          tmdbTrending={tmdbTrending}
          tmdbImporting={tmdbImporting}
          existingTmdbIds={existingTmdbIds}
          importFromTmdb={importFromTmdb}
          handleTmdbSearch={handleTmdbSearch}
          setShowTmdbPanel={setShowTmdbPanel}
          tmdbCategory={tmdbCategory}
          setTmdbCategory={setTmdbCategory}
          tmdbRegion={tmdbRegion}
          setTmdbRegion={setTmdbRegion}
          loadingCategoryMovies={loadingCategoryMovies}
          tmdbType={tmdbType}
          setTmdbType={setTmdbType}
        />
      )}

      {editingMovie && (
        <MovieForm
          key={editingMovie.id || 'new'}
          editingMovie={editingMovie}
          localMovies={localMovies}
          closeForm={closeForm}
          refetch={refetch}
        />
      )}

      {jsonView ? (
        <pre className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 text-[11px] text-white/50 overflow-auto max-h-[70vh]">
          {JSON.stringify(filtered, null, 2)}
        </pre>
      ) : (
        <>
          <div className="bg-cinema-900 border border-white/[0.06] rounded-lg overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/40 text-[11px] uppercase tracking-wider">
                  <th className="text-left p-2 w-10"></th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2 w-14">Year</th>
                  <th className="text-left p-2 w-12">Rating</th>
                  <th className="text-left p-2 w-16">Type</th>
                  <th className="text-left p-2 w-20 hidden sm:table-cell">Genre</th>
                  <th className="text-left p-2 w-14 hidden md:table-cell">Quality</th>
                  <th className="text-left p-2 w-12 hidden lg:table-cell">Dir</th>
                  <th className="text-left p-2 w-10 hidden lg:table-cell">Trailer</th>
                  <th className="text-left p-2 w-10 hidden lg:table-cell">Stream</th>
                  <th className="text-left p-2 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-2">
                      <div className="w-7 h-10 rounded overflow-hidden bg-cinema-800">
                        <img src={m.poster} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-2">
                      <span className="font-medium">{m.title}</span>
                    </td>
                    <td className="p-2 text-white/50">{m.year}</td>
                    <td className="p-2">
                      <span className={m.rating > 0 ? 'text-yellow-400' : 'text-white/20'}>{m.rating || '—'}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            m.type === 'series' ? 'bg-purple-600/20 text-purple-400' : 'bg-green-600/20 text-green-400'
                          }`}
                        >
                          {m.type || 'movie'}
                        </span>
                        {m.isTrending && <span className="text-[10px]">🔥</span>}
                      </div>
                    </td>
                    <td className="p-2 text-white/40 truncate max-w-[120px] hidden sm:table-cell">
                      {Array.isArray(m.genre) ? m.genre.join(', ') : ''}
                    </td>
                    <td className="p-2 text-white/40 hidden md:table-cell">{m.quality || '—'}</td>
                    <td className="p-2 text-white/40 truncate max-w-[80px] hidden lg:table-cell" title={m.director}>
                      {m.director || '—'}
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      {m.trailerUrl ? (
                        <a href={m.trailerUrl} target="_blank" rel="noopener noreferrer" className="text-cinema-red hover:text-cinema-red/80">
                          <IconBrandYoutube size={14} />
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="p-2 hidden lg:table-cell">
                      {m.streamUrl ? (
                        <a href={m.streamUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-400/80">
                          <IconWorld size={14} />
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditForm(m)}
                          className="px-2 py-0.5 bg-white/[0.06] text-white/60 text-[10px] rounded hover:bg-white/[0.1]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="px-2 py-0.5 bg-cinema-red/10 text-cinema-red text-[10px] rounded hover:bg-cinema-red/20"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 text-white/40 hover:text-white disabled:opacity-20"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="text-[12px] text-white/40">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 text-white/40 hover:text-white disabled:opacity-20"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
