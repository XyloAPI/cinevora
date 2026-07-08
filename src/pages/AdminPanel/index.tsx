import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAllMovies, useGenres as useGenresHook } from '@/hooks/useMovies'
import { slugify } from '@/lib/utils'
import { deleteMovie, runMigration, backfillSlugs } from '@/lib/db'
import * as tmdb from '@/lib/tmdb'
import { IconLogout, IconRefresh } from '@tabler/icons-react'
import type { Movie, TmdbMovieResult } from '@/types'

// Modular components & sub-components
import LoginForm from '@/components/admin/LoginForm'
import DashboardTab from '@/components/admin/DashboardTab'
import GenresTab from '@/components/admin/GenresTab'
import ToolsTab from '@/components/admin/ToolsTab'
import MoviesTab from './MoviesTab'

type Tab = 'dashboard' | 'movies' | 'genres' | 'tools'
const PAGE_SIZE = 15

export default function AdminPanel() {
  const [authed, setAuthed] = useState(
    () => !!sessionStorage.getItem('admin_auth') && !!sessionStorage.getItem('admin_token')
  )
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'dashboard'
  const setTab = useCallback(
    (t: Tab) => {
      setSearchParams(
        (prev) => {
          if (t === 'dashboard') {
            prev.delete('tab')
            return prev
          }
          prev.set('tab', t)
          return prev
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const [movieFilter, setMovieFilter] = useState('')
  const [localMovies, setLocalMovies] = useState<Movie[]>([])
  const [editingMovie, setEditingMovie] = useState<Partial<Movie> | null>(null)
  const [jsonView, setJsonView] = useState(false)
  const [page, setPage] = useState(0)

  const { data: moviesData, isLoading, refetch } = useAllMovies()
  const { data: genresData } = useGenresHook()

  const [tmdbSearch, setTmdbSearch] = useState('')
  const [tmdbType, setTmdbType] = useState<'movie' | 'series'>('movie')
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

  const openEditForm = useCallback((m: Movie) => {
    setEditingMovie({ ...m })
  }, [])

  const closeForm = useCallback(() => {
    setEditingMovie(null)
  }, [])

  useEffect(() => {
    if (moviesData) {
      setLocalMovies(moviesData)
      setPage(0)
    }
  }, [moviesData])

  useEffect(() => {
    if (!authed) return
    setLoadingCategoryMovies(true)
    tmdb
      .getMoviesByCategory(tmdbCategory, tmdbRegion)
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
      const res = await tmdb.searchMovies(tmdbSearch, tmdbType)
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
      const { detail, videos, credits } = await tmdb.enrichMovie(tmdbId, tmdbType)
      const genreNames = detail.genres.map((g) => g.name)
      const mapped = tmdb.mapTmdbToMovie(detail, videos, credits, genreNames, tmdbType)
      const { logos } = await tmdb.fetchMovieImages(tmdbId, tmdbType)
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
        type: tmdbType,
        episodes: mapped.episodes,
        seasons: mapped.seasons,
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
        streamUrl:
          tmdbType === 'series' && detail.seasons
            ? JSON.stringify(
                detail.seasons
                  .filter((s) => s.season_number > 0)
                  .map((s) => ({
                    season: s.season_number,
                    episodes: Array.from({ length: s.episode_count }, (_, i) => ({
                      episode: i + 1,
                      url: '',
                    })),
                  }))
              )
            : undefined,
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

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Delete this movie?')) return
      try {
        await deleteMovie(id)
        toast.success('Movie deleted')
        refetch()
      } catch {
        toast.error('Failed to delete movie')
      }
    },
    [refetch]
  )

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
          <button
            onClick={logout}
            className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"
            title="Sign Out"
          >
            <IconLogout size={16} />
          </button>
        </div>

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded text-[13px] font-medium transition-colors whitespace-nowrap text-left w-full ${
                tab === t.id ? 'bg-cinema-red text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
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

        {tab === 'dashboard' && <DashboardTab stats={stats} localMovies={localMovies} />}

        {tab === 'movies' && (
          <MoviesTab
            movieFilter={movieFilter}
            setMovieFilter={setMovieFilter}
            jsonView={jsonView}
            setJsonView={setJsonView}
            showTmdbPanel={showTmdbPanel}
            setShowTmdbPanel={setShowTmdbPanel}
            openAddForm={openAddForm}
            openEditForm={openEditForm}
            handleDelete={handleDelete}
            paginated={paginated}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            filtered={filtered}
            existingTmdbIds={existingTmdbIds}
            importFromTmdb={importFromTmdb}
            handleTmdbSearch={handleTmdbSearch}
            tmdbSearch={tmdbSearch}
            setTmdbSearch={setTmdbSearch}
            tmdbSearching={tmdbSearching}
            tmdbResults={tmdbResults}
            tmdbTrending={tmdbTrending}
            tmdbImporting={tmdbImporting}
            tmdbCategory={tmdbCategory}
            setTmdbCategory={setTmdbCategory}
            tmdbRegion={tmdbRegion}
            setTmdbRegion={setTmdbRegion}
            loadingCategoryMovies={loadingCategoryMovies}
            tmdbType={tmdbType}
            setTmdbType={setTmdbType}
            editingMovie={editingMovie}
            localMovies={localMovies}
            closeForm={closeForm}
            refetch={refetch}
          />
        )}

        {tab === 'genres' && <GenresTab genresData={genresData} />}

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
