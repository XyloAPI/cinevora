import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAllMovies, useGenres as useGenresHook } from '@/hooks/useMovies'
import { slugify } from '@/lib/utils'
import { deleteMovie, runMigration, backfillSlugs } from '@/lib/db'
import * as tmdb from '@/lib/tmdb'
import {
  IconLogout,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconBrandYoutube,
  IconWorld,
} from '@tabler/icons-react'
import type { Movie, TmdbMovieResult } from '@/types'

// Modular components
import LoginForm from '@/components/admin/LoginForm'
import DashboardTab from '@/components/admin/DashboardTab'
import GenresTab from '@/components/admin/GenresTab'
import ToolsTab from '@/components/admin/ToolsTab'
import TmdbPanel from '@/components/admin/TmdbPanel'
import MovieForm from '@/components/admin/MovieForm'

type Tab = 'dashboard' | 'movies' | 'genres' | 'tools'
const PAGE_SIZE = 15

export default function AdminPanel() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('admin_auth') && !!sessionStorage.getItem('admin_token'))
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'dashboard'
  const setTab = useCallback((t: Tab) => {
    setSearchParams((prev) => {
      if (t === 'dashboard') { prev.delete('tab'); return prev }
      prev.set('tab', t)
      return prev
    }, { replace: true })
  }, [setSearchParams])

  const [movieFilter, setMovieFilter] = useState('')
  const [localMovies, setLocalMovies] = useState<Movie[]>([])
  const [editingMovie, setEditingMovie] = useState<Partial<Movie> | null>(null)
  const [jsonView, setJsonView] = useState(false)
  const [page, setPage] = useState(0)

  const { data: moviesData, isLoading, refetch } = useAllMovies()
  const { data: genresData } = useGenresHook()

  const [tmdbSearch, setTmdbSearch] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbMovieResult[]>([])
  const [tmdbSearching, setTmdbSearching] = useState(false)
  const [tmdbTrending, setTmdbTrending] = useState<TmdbMovieResult[]>([])
  const [tmdbImporting, setTmdbImporting] = useState<Set<number>>(new Set())
  const [showTmdbPanel, setShowTmdbPanel] = useState(false)
  const [tmdbCategory, setTmdbCategory] = useState<'trending' | 'now_playing' | 'popular' | 'top_rated'>('trending')
  const [tmdbRegion, setTmdbRegion] = useState('')
  const [loadingCategoryMovies, setLoadingCategoryMovies] = useState(false)

  function openAddForm() {
    setEditingMovie({
      id: '',
      title: '',
      year: new Date().getFullYear(),
      rating: 0,
      genre: [],
      poster: '',
      backdrop: '',
      synopsis: '',
      isTrending: false,
      isFeatured: false,
      comingSoon: false,
      type: 'movie',
    })
  }

  function openEditForm(m: Movie) {
    setEditingMovie({ ...m })
  }

  function closeForm() {
    setEditingMovie(null)
  }

  useEffect(() => {
    if (moviesData) {
      setLocalMovies(moviesData)
      setPage(0)
    }
  }, [moviesData])

  useEffect(() => {
    if (!authed) return
    setLoadingCategoryMovies(true)
    tmdb.getMoviesByCategory(tmdbCategory, tmdbRegion)
      .then((res) => {
        setTmdbTrending(res.results || [])
      })
      .catch(() => {})
      .finally(() => {
        setLoadingCategoryMovies(false)
      })
  }, [authed, tmdbCategory, tmdbRegion])

  useEffect(() => {
    if (!authed) return
    runMigration().catch(() => {})
  }, [authed])

  function logout() {
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_auth')
    setAuthed(false)
  }

  async function handleTmdbSearch() {
    if (!tmdbSearch.trim()) return
    setTmdbSearching(true)
    try {
      const res = await tmdb.searchMovies(tmdbSearch)
      setTmdbResults(res.results || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setTmdbSearching(false)
    }
  }

  async function importFromTmdb(tmdbId: number) {
    setTmdbImporting((prev) => {
      const next = new Set(prev)
      next.add(tmdbId)
      return next
    })
    try {
      const { detail, videos, credits } = await tmdb.enrichMovie(tmdbId)
      const genreNames = detail.genres.map((g) => g.name)
      const mapped = tmdb.mapTmdbToMovie(detail, videos, credits, genreNames)
      const { logos } = await tmdb.fetchMovieImages(tmdbId)
      const logoUrl = tmdb.logoUrl(logos)

      // Open edit form with prefilled data instead of directly saving
      setEditingMovie({
        id: `tmdb-${detail.id}`,
        slug: slugify(`${mapped.title} ${mapped.year}`),
        title: mapped.title,
        year: mapped.year,
        rating: mapped.rating,
        genre: mapped.genre,
        poster: mapped.poster,
        backdrop: mapped.backdrop,
        synopsis: mapped.synopsis,
        isTrending: mapped.isTrending,
        isFeatured: mapped.isFeatured,
        comingSoon: mapped.comingSoon,
        releaseDate: mapped.releaseDate || undefined,
        quality: mapped.quality || undefined,
        duration: mapped.duration || undefined,
        type: 'movie',
        tmdbId: mapped.tmdbId,
        imdbId: mapped.imdbId || undefined,
        tagline: mapped.tagline || undefined,
        runtime: mapped.runtime || undefined,
        budget: mapped.budget || undefined,
        revenue: mapped.revenue || undefined,
        originalLanguage: mapped.originalLanguage || undefined,
        popularity: mapped.popularity || undefined,
        voteCount: mapped.voteCount || undefined,
        homepage: mapped.homepage || undefined,
        director: mapped.director || undefined,
        cast: mapped.cast,
        logoUrl: logoUrl || undefined,
        trailerUrl: mapped.trailerUrl || undefined,
        streamUrl: undefined,
        productionCompanies: mapped.productionCompanies,
        status: mapped.status || undefined,
      })
      toast.info(`Editing "${mapped.title}" - review before saving`)
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTmdbImporting((prev) => {
        const next = new Set(prev)
        next.delete(tmdbId)
        return next
      })
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this movie?')) return
    try {
      await deleteMovie(id)
      toast.success('Movie deleted')
      refetch()
    } catch {
      toast.error('Failed to delete movie')
    }
  }, [refetch])

  const filtered = useMemo(() => {
    return localMovies.filter((m) => {
      const q = movieFilter.toLowerCase()
      return (
        m.title.toLowerCase().includes(q) ||
        m.synopsis.toLowerCase().includes(q) ||
        m.genre.some((g) => g.toLowerCase().includes(q))
      )
    })
  }, [localMovies, movieFilter])

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const existingTmdbIds = useMemo(() => {
    return new Set(localMovies.map((m) => m.tmdbId).filter(Boolean) as number[])
  }, [localMovies])

  const stats = useMemo(() => {
    return {
      total: localMovies.length,
      movies: localMovies.filter((m) => m.type !== 'series').length,
      series: localMovies.filter((m) => m.type === 'series').length,
      trending: localMovies.filter((m) => m.isTrending).length,
      comingSoon: localMovies.filter((m) => m.comingSoon).length,
      genres: genresData?.length ?? 0,
      withTrailer: localMovies.filter((m) => m.trailerUrl).length,
      withStream: localMovies.filter((m) => m.streamUrl).length,
    }
  }, [localMovies, genresData])

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'movies', label: 'Movie Manager' },
    { id: 'genres', label: 'Genre Manager' },
    { id: 'tools', label: 'Developer Tools' },
  ]

  return (
    <div className="min-h-screen bg-cinema-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-cinema-900 border-b md:border-b-0 md:border-r border-white/[0.06] p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-8">
          <img src="/Cinevora.avif" alt="Cinevora" className="h-6" />
          <button onClick={logout} className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors" title="Sign Out">
            <IconLogout size={16} />
          </button>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded text-[13px] font-medium transition-colors whitespace-nowrap text-left w-full ${tab === t.id ? 'bg-cinema-red text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-white/40 text-sm mb-4">
            <IconRefresh size={16} className="animate-spin" /> Loading databases...
          </div>
        )}

        {tab === 'dashboard' && (
          <DashboardTab stats={stats} localMovies={localMovies} />
        )}

        {tab === 'movies' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold">Movie Manager</h2>
              <div className="flex items-center gap-2">
                <input value={movieFilter} onChange={(e) => setMovieFilter(e.target.value)} placeholder="Filter movies..."
                  className="bg-cinema-900 text-white text-[12px] px-3 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 w-44" />
                <button onClick={() => setJsonView(!jsonView)} className={`px-3 py-1.5 rounded text-[12px] border transition-colors ${jsonView ? 'bg-white/10 border-white/20 text-white' : 'border-white/[0.06] text-white/60 hover:bg-white/5'}`}>
                  JSON
                </button>
                <button onClick={() => setShowTmdbPanel(!showTmdbPanel)} className="px-3 py-1.5 bg-cinema-red/10 text-cinema-red text-[12px] font-medium rounded hover:bg-cinema-red/20">
                  TMDB
                </button>
                <button onClick={openAddForm} className="px-3 py-1.5 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark">
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
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.type === 'series' ? 'bg-purple-600/20 text-purple-400' : 'bg-green-600/20 text-green-400'}`}>
                                {m.type || 'movie'}
                              </span>
                              {m.isTrending && <span className="text-[10px]">🔥</span>}
                            </div>
                          </td>
                          <td className="p-2 text-white/40 truncate max-w-[120px] hidden sm:table-cell">{m.genre.join(', ')}</td>
                          <td className="p-2 text-white/40 hidden md:table-cell">{m.quality || '—'}</td>
                          <td className="p-2 text-white/40 truncate max-w-[80px] hidden lg:table-cell" title={m.director}>{m.director || '—'}</td>
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
                              <button onClick={() => openEditForm(m)} className="px-2 py-0.5 bg-white/[0.06] text-white/60 text-[10px] rounded hover:bg-white/[0.1]">Edit</button>
                              <button onClick={() => handleDelete(m.id)} className="px-2 py-0.5 bg-cinema-red/10 text-cinema-red text-[10px] rounded hover:bg-cinema-red/20">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 text-white/40 hover:text-white disabled:opacity-20">
                      <IconChevronLeft size={16} />
                    </button>
                    <span className="text-[12px] text-white/40">{page + 1} / {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 text-white/40 hover:text-white disabled:opacity-20">
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === 'genres' && (
          <GenresTab genresData={genresData} />
        )}

        {tab === 'tools' && (
          <ToolsTab
            localMovies={localMovies}
            refetch={refetch}
            runMigration={runMigration}
            backfillSlugs={backfillSlugs}
            slugify={slugify}
          />
        )}
      </main>
    </div>
  )
}
