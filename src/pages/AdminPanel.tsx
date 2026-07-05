import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAllMovies, useGenres as useGenresHook } from '@/hooks/useMovies'
import { slugify } from '@/lib/utils'
import { addMovie, updateMovie, deleteMovie, upsertMovie, runMigration, backfillSlugs } from '@/lib/db'
import { translateToId } from '@/lib/translate'
import * as tmdb from '@/lib/tmdb'
import { IconLogout, IconRefresh, IconChevronLeft, IconChevronRight, IconLock, IconSearch, IconMovie, IconBrandYoutube, IconWorld, IconStar, IconTrendingUp, IconLanguage } from '@tabler/icons-react'
import type { Movie, TmdbMovieResult } from '@/types'

type Tab = 'dashboard' | 'movies' | 'genres' | 'tools'
const PAGE_SIZE = 15

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_token', data.token)
        sessionStorage.setItem('admin_auth', 'true')
        onLogin()
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinema-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <img src="/Cinevora.avif" alt="Cinevora" className="h-8" />
        </div>
        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <IconLock size={16} className="text-white/40" />
            <h1 className="text-sm font-semibold">Admin Access</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 disabled:opacity-50" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
              className="w-full bg-cinema-800 text-white text-[13px] px-3 py-2 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 disabled:opacity-50" />
            {error && <p className="text-[11px] text-cinema-red">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 bg-cinema-red text-white text-[13px] font-medium rounded hover:bg-cinema-red-dark transition-colors disabled:opacity-50">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

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
  const [synopsisText, setSynopsisText] = useState('')
  const [jsonView, setJsonView] = useState(false)
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle')
  const [page, setPage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const originalSynopsisRef = useRef('')
  const [translatingSynopsis, setTranslatingSynopsis] = useState(false)
  const [synopsisTranslated, setSynopsisTranslated] = useState(false)
  const { data: moviesData, isLoading, refetch } = useAllMovies()
  const { data: genresData } = useGenresHook()

  const [tmdbSearch, setTmdbSearch] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbMovieResult[]>([])
  const [tmdbSearching, setTmdbSearching] = useState(false)
  const [tmdbTrending, setTmdbTrending] = useState<TmdbMovieResult[]>([])
  const [tmdbImporting, setTmdbImporting] = useState<Set<number>>(new Set())
  const [showTmdbPanel, setShowTmdbPanel] = useState(false)

  function openAddForm() {
    setSynopsisText('')
    setSynopsisTranslated(false)
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
    setFormKey((k) => k + 1)
  }

  function openEditForm(m: Movie) {
    setSynopsisText(m.synopsis || '')
    setSynopsisTranslated(false)
    setEditingMovie({ ...m })
    setFormKey((k) => k + 1)
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
    tmdb.fetchGenres().catch(() => {})
    tmdb.getTrending('week', 1).then((r) => setTmdbTrending(r.results)).catch(() => {})
  }, [authed])

  useEffect(() => {
    if (!authed) return
    runMigration()
  }, [authed])

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />

  function logout() {
    sessionStorage.removeItem('admin_auth')
    sessionStorage.removeItem('admin_token')
    setAuthed(false)
  }

  async function handleTmdbSearch() {
    if (!tmdbSearch.trim()) return
    setTmdbSearching(true)
    try {
      const res = await tmdb.searchMovies(tmdbSearch)
      setTmdbResults(res.results)
    } catch {
      toast.error('TMDB search failed')
    } finally {
      setTmdbSearching(false)
    }
  }

  async function importFromTmdb(tmdbId: number) {
    setTmdbImporting((prev) => new Set(prev).add(tmdbId))
    try {
      const { detail, videos, credits } = await tmdb.enrichMovie(tmdbId)
      const genreNames = detail.genres.map((g) => g.name)
      const mapped = tmdb.mapTmdbToMovie(detail, videos, credits, genreNames)
      const { logos } = await tmdb.fetchMovieImages(tmdbId)
      const logoUrl = tmdb.logoUrl(logos)
      // Open edit form with prefilled data instead of directly saving
      setSynopsisText(mapped.synopsis || '')
      setSynopsisTranslated(false)
      setEditingMovie({
        id: `tmdb-${detail.id}`,
        slug: slugify(mapped.title),
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
        quality: undefined,
        duration: mapped.duration || undefined,
        type: 'movie' as const,
        episodes: undefined,
        seasons: undefined,
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
      setFormKey((k) => k + 1)
      toast.info(`Editing "${mapped.title}" - review before saving`)
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`)
    } finally {
      setTmdbImporting((prev) => {
        const next = new Set(prev)
        next.delete(tmdbId)
        return next
      })
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMovie) return
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const isEdit = localMovies.some((m) => m.id === editingMovie.id)
    const genreRaw = (form.get('genre') as string || '').split(',').map((g) => g.trim()).filter(Boolean)
    const castRaw = (form.get('cast') as string || '').split(',').map((c) => c.trim()).filter(Boolean)
    const prodRaw = (form.get('productionCompanies') as string || '').split(',').map((c) => c.trim()).filter(Boolean)

    const title = (form.get('title') as string) || ''
    const data = {
      slug: slugify(title),
      title,
      year: Number(form.get('year')),
      rating: Number(form.get('rating')),
      genre: JSON.stringify(genreRaw),
      poster: (form.get('poster') as string) || '',
      backdrop: (form.get('backdrop') as string) || '',
      synopsis: synopsisText || '',
      is_trending: form.get('isTrending') === 'on' ? 1 : 0,
      is_featured: form.get('isFeatured') === 'on' ? 1 : 0,
      coming_soon: form.get('comingSoon') === 'on' ? 1 : 0,
      release_date: (form.get('releaseDate') as string) || null,
      quality: (form.get('quality') as string) || null,
      duration: (form.get('duration') as string) || null,
      type: (form.get('type') as string) || 'movie',
      episodes: null,
      seasons: null,
      tmdb_id: Number(form.get('tmdbId')) || null,
      imdb_id: (form.get('imdbId') as string) || null,
      tagline: (form.get('tagline') as string) || null,
      runtime: Number(form.get('runtime')) || null,
      budget: Number(form.get('budget')) || null,
      revenue: Number(form.get('revenue')) || null,
      original_language: (form.get('originalLanguage') as string) || null,
      popularity: Number(form.get('popularity')) || null,
      vote_count: Number(form.get('voteCount')) || null,
      homepage: (form.get('homepage') as string) || null,
      director: (form.get('director') as string) || null,
      cast: castRaw.length ? JSON.stringify(castRaw) : null,
      logo_url: (form.get('logoUrl') as string) || null,
      trailer_url: (form.get('trailerUrl') as string) || null,
      stream_url: (form.get('streamUrl') as string) || null,
      production_companies: prodRaw.length ? JSON.stringify(prodRaw) : null,
      status: (form.get('status') as string) || null,
    }

    try {
      if (isEdit) {
        await updateMovie(editingMovie.id!, data)
        toast.success('Movie updated')
      } else {
        await addMovie({ id: String(Date.now()), ...data })
        toast.success('Movie added')
      }
      closeForm()
      refetch()
    } catch {
      toast.error(isEdit ? 'Failed to update movie' : 'Failed to add movie')
    } finally {
      setSaving(false)
    }
  }, [editingMovie, localMovies, refetch, synopsisText])

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

  const filtered = movieFilter
    ? localMovies.filter((m) => m.title.toLowerCase().includes(movieFilter.toLowerCase()))
    : localMovies

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const existingTmdbIds = useMemo(() => new Set(localMovies.filter((m) => m.tmdbId).map((m) => m.tmdbId!)), [localMovies])

  const stats = {
    total: localMovies.length,
    movies: localMovies.filter((m) => m.type === 'movie' || !m.type).length,
    series: localMovies.filter((m) => m.type === 'series').length,
    trending: localMovies.filter((m) => m.isTrending).length,
    comingSoon: localMovies.filter((m) => m.comingSoon).length,
    genres: genresData?.length ?? 0,
    withTrailer: localMovies.filter((m) => m.trailerUrl).length,
    withStream: localMovies.filter((m) => m.streamUrl).length,
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'movies', label: 'Movies' },
    { key: 'genres', label: 'Genres' },
    { key: 'tools', label: 'Tools' },
  ]

  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <header className="fixed top-0 left-0 right-0 z-50 bg-cinema-950/95 backdrop-blur-md border-b border-white/[0.04] h-14">
        <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/Cinevora.avif" alt="Cinevora" className="h-6" />
            <span className="text-[10px] text-white/30 font-normal">Hub</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`whitespace-nowrap px-2 sm:px-2.5 py-1 text-[12px] rounded transition-colors ${tab === t.key ? 'bg-cinema-red text-white' : 'text-white/40 hover:text-white hover:bg-white/[0.04]'}`}
              >
                {t.label}
              </button>
            ))}
            <button onClick={() => { refetch(); toast.success('Refreshed') }} className="p-1.5 text-white/30 hover:text-white transition-colors" title="Refresh data">
              <IconRefresh size={15} />
            </button>
            <button onClick={logout} className="p-1.5 text-white/30 hover:text-white transition-colors" title="Logout">
              <IconLogout size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === 'dashboard' && (
          <section>
            <h2 className="text-base font-bold mb-4">Dashboard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
              {[
                { label: 'Total', value: stats.total, color: 'bg-blue-600/20 text-blue-400' },
                { label: 'Movies', value: stats.movies, color: 'bg-green-600/20 text-green-400' },
                { label: 'Series', value: stats.series, color: 'bg-purple-600/20 text-purple-400' },
                { label: 'Trending', value: stats.trending, color: 'bg-cinema-red/20 text-cinema-red' },
                { label: 'Coming Soon', value: stats.comingSoon, color: 'bg-yellow-600/20 text-yellow-400' },
                { label: 'Genres', value: stats.genres, color: 'bg-cyan-600/20 text-cyan-400' },
                { label: 'With Trailer', value: stats.withTrailer, color: 'bg-pink-600/20 text-pink-400' },
                { label: 'With Stream', value: stats.withStream, color: 'bg-orange-600/20 text-orange-400' },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-lg p-4 border border-white/[0.04]`}>
                  <p className="text-[11px] uppercase tracking-wider opacity-60 mb-1">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Recent Movies</h3>
              <div className="space-y-2">
                {localMovies.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 text-[13px]">
                    <div className="w-8 h-12 rounded overflow-hidden bg-cinema-800 shrink-0">
                      <img src={m.poster} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 truncate">{m.title}</span>
                    <span className="text-white/30 text-[11px]">{m.year}</span>
                    {m.trailerUrl && <IconBrandYoutube size={12} className="text-cinema-red" />}
                    {m.streamUrl && <IconWorld size={12} className="text-green-400" />}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.type === 'series' ? 'bg-purple-600/20 text-purple-400' : 'bg-green-600/20 text-green-400'}`}>
                      {m.type || 'movie'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.isTrending ? 'bg-cinema-red/20 text-cinema-red' : 'bg-white/5 text-white/20'}`}>
                      {m.isTrending ? 'Trending' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === 'movies' && (
          <section>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-bold">Movie Manager</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowTmdbPanel(!showTmdbPanel)}
                  className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 text-[12px] rounded hover:bg-cyan-600/30 transition-colors">
                  TMDB
                </button>
                <input type="text" placeholder="Search movies..." value={movieFilter}
                  onChange={(e) => { setMovieFilter(e.target.value); setPage(0) }}
                  className="bg-cinema-900 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 w-36 sm:w-44" />
                <button onClick={() => editingMovie ? closeForm() : openAddForm()}
                  className="px-3 py-1.5 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark transition-colors">
                  {editingMovie ? 'Cancel' : '+ Add'}
                </button>
                <button onClick={() => setJsonView(!jsonView)}
                  className="px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] transition-colors">
                  {jsonView ? 'Table' : 'JSON'}
                </button>
              </div>
            </div>

            {showTmdbPanel && (
              <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <IconMovie size={14} className="text-cinema-red" /> TMDB Import
                  </h3>
                  <button onClick={() => setShowTmdbPanel(false)} className="text-[11px] text-white/30 hover:text-white">Close</button>
                </div>
                <div className="flex gap-2 mb-3">
                  <input value={tmdbSearch} onChange={(e) => setTmdbSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
                    placeholder="Search TMDB movies..."
                    className="flex-1 bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50" />
                  <button onClick={handleTmdbSearch} disabled={tmdbSearching}
                    className="px-3 py-1.5 bg-cinema-red text-white text-[12px] rounded hover:bg-cinema-red-dark disabled:opacity-50 flex items-center gap-1">
                    <IconSearch size={13} /> {tmdbSearching ? '...' : 'Search'}
                  </button>
                </div>
                {tmdbResults.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[11px] text-white/30 mb-2">Search results ({tmdbResults.length})</p>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {tmdbResults.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-[12px] bg-cinema-800/50 rounded px-2 py-1.5">
                          <div className="w-6 h-9 rounded overflow-hidden bg-cinema-800 shrink-0">
                            {m.poster_path && <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="flex-1 truncate">{m.title} <span className="text-white/30">({m.release_date?.slice(0, 4)})</span></span>
                          <span className="text-yellow-400/70 text-[10px]">{m.vote_average.toFixed(1)}</span>
                          {existingTmdbIds.has(m.id) ? (
                            <span className="px-2 py-0.5 bg-white/5 text-white/30 text-[10px] rounded">In DB</span>
                          ) : (
                            <button onClick={() => importFromTmdb(m.id)} disabled={tmdbImporting.has(m.id)}
                              className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 disabled:opacity-50">
                              {tmdbImporting.has(m.id) ? '...' : 'Import'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-white/30 mb-2 flex items-center gap-1"><IconTrendingUp size={12} /> Trending This Week</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {tmdbTrending.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-[12px] bg-cinema-800/50 rounded px-2 py-1.5">
                          <div className="w-6 h-9 rounded overflow-hidden bg-cinema-800 shrink-0">
                            {m.poster_path && <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="flex-1 truncate">{m.title} <span className="text-white/30">({m.release_date?.slice(0, 4)})</span></span>
                          <span className="text-yellow-400/70 text-[10px]">{m.vote_average.toFixed(1)}</span>
                          {existingTmdbIds.has(m.id) ? (
                            <span className="px-2 py-0.5 bg-white/5 text-white/30 text-[10px] rounded">In DB</span>
                          ) : (
                            <button onClick={() => importFromTmdb(m.id)} disabled={tmdbImporting.has(m.id)}
                              className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 disabled:opacity-50">
                              {tmdbImporting.has(m.id) ? '...' : 'Import'}
                            </button>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {editingMovie && (
              <form onSubmit={handleSubmit} key={formKey} className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{localMovies.some((m) => m.id === editingMovie.id) ? 'Edit Movie' : 'Add Movie'}</h3>
                  {editingMovie.poster && (
                    <img src={editingMovie.poster} alt="" className="h-10 rounded object-cover" />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Title *<input name="title" defaultValue={editingMovie.title} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Year *<input name="year" type="number" defaultValue={editingMovie.year} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Rating *<input name="rating" type="number" step="0.1" defaultValue={editingMovie.rating} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Genre *<input name="genre" defaultValue={editingMovie.genre?.join(', ')} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Poster URL *<input name="poster" defaultValue={editingMovie.poster} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Backdrop URL *<input name="backdrop" defaultValue={editingMovie.backdrop} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/40">Synopsis *</span>
                      <button type="button" disabled={translatingSynopsis} onClick={async () => {
                        if (translatingSynopsis) return
                        if (synopsisTranslated) {
                          setSynopsisText(originalSynopsisRef.current)
                          setSynopsisTranslated(false)
                          return
                        }
                        const text = synopsisText
                        if (!text.trim()) return
                        originalSynopsisRef.current = text
                        setTranslatingSynopsis(true)
                        try {
                          const t = await translateToId(text)
                          setSynopsisText(t)
                          setSynopsisTranslated(true)
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Translate failed')
                        } finally {
                          setTranslatingSynopsis(false)
                        }
                      }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors uppercase tracking-wider disabled:opacity-50 ${translatingSynopsis ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : synopsisTranslated ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-cinema-red/20 text-cinema-red hover:bg-cinema-red/30'}`}>
                        {translatingSynopsis ? <><span className="inline-block w-2 h-2 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> ID</> : synopsisTranslated ? <><IconLanguage size={11} /> Asli</> : <><IconLanguage size={11} /> ID</>}
                      </button>
                    </div>
                    <textarea name="synopsis" value={synopsisText} onChange={(e) => setSynopsisText(e.target.value)} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none resize-none h-16 mt-0.5" />
                  </div>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Tagline<input name="tagline" defaultValue={editingMovie.tagline || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Release Date<input name="releaseDate" type="date" defaultValue={editingMovie.releaseDate || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Duration<input name="duration" defaultValue={editingMovie.duration || ''} placeholder="e.g. 2h 28m" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Runtime (min)<input name="runtime" type="number" defaultValue={editingMovie.runtime ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Quality<input name="quality" defaultValue={editingMovie.quality || ''} placeholder="e.g. WEB-DL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Director<input name="director" defaultValue={editingMovie.director || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Cast<input name="cast" defaultValue={editingMovie.cast?.join(', ') || ''} placeholder="comma separated" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Logo URL<input name="logoUrl" defaultValue={editingMovie.logoUrl || ''} placeholder="TMDB logo URL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Trailer URL<input name="trailerUrl" defaultValue={editingMovie.trailerUrl || ''} placeholder="YouTube URL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Stream URL<input name="streamUrl" defaultValue={editingMovie.streamUrl || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Homepage<input name="homepage" defaultValue={editingMovie.homepage || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Original Lang.<input name="originalLanguage" defaultValue={editingMovie.originalLanguage || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Production Co.<input name="productionCompanies" defaultValue={editingMovie.productionCompanies?.join(', ') || ''} placeholder="comma separated" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Status<input name="status" defaultValue={editingMovie.status || ''} placeholder="e.g. Released" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Budget<input name="budget" type="number" defaultValue={editingMovie.budget ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Revenue<input name="revenue" type="number" defaultValue={editingMovie.revenue ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">TMDB ID<input name="tmdbId" type="number" defaultValue={editingMovie.tmdbId ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">IMDB ID<input name="imdbId" defaultValue={editingMovie.imdbId || ''} placeholder="tt..." className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Popularity<input name="popularity" type="number" step="0.1" defaultValue={editingMovie.popularity ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Vote Count<input name="voteCount" type="number" defaultValue={editingMovie.voteCount ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <input name="isTrending" type="checkbox" defaultChecked={editingMovie.isTrending} className="accent-cinema-red" /> Trending
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <input name="isFeatured" type="checkbox" defaultChecked={editingMovie.isFeatured} className="accent-cinema-red" /> Featured
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <input name="comingSoon" type="checkbox" defaultChecked={editingMovie.comingSoon} className="accent-cinema-red" /> Coming Soon
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-[11px] text-white/40">Type<select name="type" defaultValue={editingMovie.type || 'movie'} className="bg-cinema-800 text-white text-[12px] px-2 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5">
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                  </select></label>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeForm} className="px-3 py-1.5 text-[12px] text-white/40 hover:text-white">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-1.5 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark disabled:opacity-50">
                    {saving ? 'Saving...' : localMovies.some((m) => m.id === editingMovie.id) ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
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
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.type === 'series' ? 'bg-purple-600/20 text-purple-400' : 'bg-green-600/20 text-green-400'}`}>
                              {m.type || 'movie'}
                            </span>
                            {m.isTrending && <span className="ml-1 text-[10px] text-cinema-red">🔥</span>}
                          </td>
                          <td className="p-2 text-white/40 truncate max-w-[120px] hidden sm:table-cell">{m.genre.join(', ')}</td>
                          <td className="p-2 text-white/40 hidden md:table-cell">{m.quality || '—'}</td>
                          <td className="p-2 text-white/40 truncate max-w-[80px] hidden lg:table-cell" title={m.director}>{m.director || '—'}</td>
                          <td className="p-2 hidden lg:table-cell">
                            {m.trailerUrl
                              ? <a href={m.trailerUrl} target="_blank" rel="noopener noreferrer" className="text-cinema-red hover:text-cinema-red/80"><IconBrandYoutube size={14} /></a>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="p-2 hidden lg:table-cell">
                            {m.streamUrl
                              ? <a href={m.streamUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-400/80"><IconWorld size={14} /></a>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditForm(m)}
                                className="px-2 py-0.5 bg-white/[0.06] text-white/60 text-[10px] rounded hover:bg-white/[0.1]">Edit</button>
                              <button onClick={() => handleDelete(m.id)}
                                className="px-2 py-0.5 bg-cinema-red/10 text-cinema-red text-[10px] rounded hover:bg-cinema-red/20">Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                      className="p-1.5 text-white/40 hover:text-white disabled:opacity-20">
                      <IconChevronLeft size={16} />
                    </button>
                    <span className="text-[12px] text-white/40">{page + 1} / {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                      className="p-1.5 text-white/40 hover:text-white disabled:opacity-20">
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {tab === 'genres' && (
          <section>
            <h2 className="text-base font-bold mb-4">Genre Manager</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {(genresData ?? []).map((g) => (
                <div key={g.name} className="bg-cinema-900 border border-white/[0.06] rounded-lg p-3 text-center">
                  <p className="text-[13px] font-medium">{g.name}</p>
                  <p className="text-[11px] text-white/30">{g.count} films</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'tools' && (
          <section>
            <h2 className="text-base font-bold mb-4">Developer Tools</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Database Status</h3>
                <button onClick={async () => {
                  setDbStatus('checking')
                  try {
                    const res = await fetch('/api/db/query', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sql: 'SELECT COUNT(*) as count FROM movies', params: [] }),
                    })
                    if (!res.ok) throw new Error(`HTTP ${res.status}`)
                    setDbStatus('ok')
                  } catch {
                    setDbStatus('fail')
                  }
                }}
                  className="px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
                  Test Connection
                </button>
                <button onClick={async () => {
                  try {
                    await runMigration()
                    toast.success('Migration ran successfully')
                  } catch {
                    toast.error('Migration failed')
                  }
                }}
                  className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
                  Run Migration
                </button>
                <button onClick={async () => {
                  try {
                    const n = await backfillSlugs()
                    toast.success(`Backfilled ${n} slugs`)
                    refetch()
                  } catch {
                    toast.error('Backfill failed')
                  }
                }}
                  className="ml-2 px-3 py-1.5 bg-white/[0.06] text-white/70 text-[12px] rounded hover:bg-white/[0.1] mb-3">
                  Backfill Slugs
                </button>
                {dbStatus === 'checking' && <p className="text-[12px] text-yellow-400">Checking...</p>}
                {dbStatus === 'ok' && <p className="text-[12px] text-green-400">Connected</p>}
                {dbStatus === 'fail' && <p className="text-[12px] text-cinema-red">Connection failed</p>}
                <div className="mt-3 text-[11px] text-white/30 space-y-1">
                  <p>Movies in DB: <span className="text-white/50">{localMovies.length}</span></p>
                  <p>API Base: <span className="text-white/50">/api</span></p>
                </div>
              </div>

              <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Export Data</h3>
                <div className="space-y-2">
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify(localMovies, null, 2)], { type: 'application/json' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `movies-${new Date().toISOString().slice(0, 10)}.json`
                    a.click()
                  }}
                    className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]">
                    Export Movies as JSON
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(localMovies, null, 2))
                    toast.success('Copied to clipboard')
                  }}
                    className="block w-full text-left px-3 py-2 bg-white/[0.04] text-white/60 text-[12px] rounded hover:bg-white/[0.08]">
                    Copy All Movies to Clipboard
                  </button>
                </div>
              </div>

              <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Movie Slugs</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {localMovies.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-[11px]">
                      <span className="text-white/50 truncate flex-1">{m.title}</span>
                      <span className="text-white/20">→</span>
                      <span className="text-cyan-400/70">{slugify(m.title)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Quick Info</h3>
                <div className="space-y-2 text-[12px] text-white/50">
                  <p>Env: <span className="text-white/70">{import.meta.env.MODE}</span></p>
                  <p>Base URL: <span className="text-white/70">{window.location.origin}</span></p>
                  <p>Admin Path: <span className="text-cinema-red">/buahlilguanteng</span></p>
                  <p>TMDB API: <span className="text-white/70">{import.meta.env.VITE_TMDB_API_KEY ? 'Configured' : 'Missing'}</span></p>
                  <p className="text-[10px] text-white/20 mt-4">Built with React + Vite + TypeScript + Tailwind + Turso DB + TMDB</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
