import { slugify } from './utils'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function dbQuery<T>(sql: string, params?: any[]): Promise<T[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = sessionStorage.getItem('admin_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}/db/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql, params }),
  })
  if (!res.ok) throw new Error(`DB error: ${res.statusText}`)
  const data = await res.json()
  return data.rows || []
}

export interface DbMovie {
  id: string
  slug: string
  title: string
  year: number
  rating: number
  genre: string
  poster: string
  backdrop: string
  synopsis: string
  is_trending: number
  is_featured: number
  coming_soon: number
  release_date: string | null
  quality: string | null
  duration: string | null
  type: string | null
  episodes: number | null
  seasons: number | null
  tmdb_id: number | null
  imdb_id: string | null
  tagline: string | null
  runtime: number | null
  budget: number | null
  revenue: number | null
  original_language: string | null
  popularity: number | null
  vote_count: number | null
  homepage: string | null
  director: string | null
  cast: string | null
  logo_url: string | null
  trailer_url: string | null
  stream_url: string | null
  production_companies: string | null
  status: string | null
}

export async function fetchAllMovies() {
  const rows = await dbQuery<DbMovie>('SELECT * FROM movies ORDER BY year DESC, title')
  return rows.map(parseDbMovie)
}

export async function fetchTrendingMovies() {
  const rows = await dbQuery<DbMovie>('SELECT * FROM movies WHERE is_trending = 1 ORDER BY year DESC, title LIMIT 10')
  return rows.map(parseDbMovie)
}

export async function fetchLatestMovies() {
  const rows = await dbQuery<DbMovie>("SELECT * FROM movies WHERE type = 'movie' OR type IS NULL ORDER BY year DESC, title LIMIT 12")
  return rows.map(parseDbMovie)
}

export async function fetchSeries() {
  const rows = await dbQuery<DbMovie>("SELECT * FROM movies WHERE type = 'series' ORDER BY year DESC, title")
  return rows.map(parseDbMovie)
}

export async function fetchComingSoon() {
  const rows = await dbQuery<DbMovie>('SELECT * FROM movies WHERE coming_soon = 1 ORDER BY release_date')
  return rows.map(parseDbMovie)
}

export async function fetchFeaturedMovie() {
  const rows = await dbQuery<DbMovie>('SELECT * FROM movies WHERE is_featured = 1 LIMIT 1')
  return rows.length ? parseDbMovie(rows[0]) : null
}

export async function fetchMovieBySlug(slug: string) {
  const rows = await dbQuery<DbMovie>('SELECT * FROM movies WHERE slug = ?', [slug])
  return rows.length ? parseDbMovie(rows[0]) : null
}

export async function getGenres() {
  const rows = await dbQuery<{ genre: string }>('SELECT DISTINCT genre FROM movies')
  const genreMap = new Map<string, number>()
  rows.forEach((row) => {
    const genres = JSON.parse(row.genre)
    genres.forEach((g: string) => {
      genreMap.set(g, (genreMap.get(g) || 0) + 1)
    })
  })
  return Array.from(genreMap.entries()).map(([name, count]) => ({
    name,
    count,
    href: `/genres?genre=${encodeURIComponent(name)}`,
  }))
}

function parseDbMovie(row: DbMovie) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year ? Number(row.year) : 0,
    rating: row.rating ? Number(row.rating) : 0,
    genre: JSON.parse(row.genre),
    poster: row.poster,
    backdrop: row.backdrop,
    synopsis: row.synopsis,
    isTrending: Number(row.is_trending) === 1,
    isFeatured: Number(row.is_featured) === 1,
    comingSoon: Number(row.coming_soon) === 1,
    releaseDate: row.release_date || undefined,
    quality: row.quality || undefined,
    duration: row.duration || undefined,
    type: (row.type as 'movie' | 'series') || 'movie',
    episodes: row.episodes ? Number(row.episodes) : undefined,
    seasons: row.seasons ? Number(row.seasons) : undefined,
    tmdbId: row.tmdb_id ? Number(row.tmdb_id) : undefined,
    imdbId: row.imdb_id || undefined,
    tagline: row.tagline || undefined,
    runtime: row.runtime ? Number(row.runtime) : undefined,
    budget: row.budget ? Number(row.budget) : undefined,
    revenue: row.revenue ? Number(row.revenue) : undefined,
    originalLanguage: row.original_language || undefined,
    popularity: row.popularity ? Number(row.popularity) : undefined,
    voteCount: row.vote_count ? Number(row.vote_count) : undefined,
    homepage: row.homepage || undefined,
    director: row.director || undefined,
    cast: row.cast ? JSON.parse(row.cast) : undefined,
    logoUrl: row.logo_url || undefined,
    trailerUrl: row.trailer_url || undefined,
    streamUrl: row.stream_url || undefined,
    productionCompanies: row.production_companies ? JSON.parse(row.production_companies) : undefined,
    status: row.status || undefined,
  }
}

export async function addMovie(movie: Omit<DbMovie, 'id'> & { id: string }) {
  const sql = `INSERT INTO movies (
    id, slug, title, year, rating, genre, poster, backdrop, synopsis,
    is_trending, is_featured, coming_soon, release_date, quality, duration, type,
    episodes, seasons, tmdb_id, imdb_id, tagline, runtime, budget, revenue,
    original_language, popularity, vote_count, homepage, director, cast,
    logo_url, trailer_url, stream_url, production_companies, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  await dbQuery(sql, [
    movie.id,
    movie.slug,
    movie.title,
    movie.year,
    movie.rating,
    movie.genre,
    movie.poster,
    movie.backdrop,
    movie.synopsis,
    movie.is_trending,
    movie.is_featured,
    movie.coming_soon,
    movie.release_date,
    movie.quality,
    movie.duration,
    movie.type,
    movie.episodes,
    movie.seasons,
    movie.tmdb_id,
    movie.imdb_id,
    movie.tagline,
    movie.runtime,
    movie.budget,
    movie.revenue,
    movie.original_language,
    movie.popularity,
    movie.vote_count,
    movie.homepage,
    movie.director,
    movie.cast,
    movie.logo_url,
    movie.trailer_url,
    movie.stream_url,
    movie.production_companies,
    movie.status,
  ])
}

export async function updateMovie(id: string, movie: Partial<DbMovie>) {
  const fields: string[] = []
  const values: any[] = []
  
  const allowedFields = ['slug', 'title', 'year', 'rating', 'genre', 'poster', 'backdrop', 'synopsis', 'is_trending', 'is_featured', 'coming_soon', 'release_date', 'quality', 'duration', 'type', 'episodes', 'seasons', 'tmdb_id', 'imdb_id', 'tagline', 'runtime', 'budget', 'revenue', 'original_language', 'popularity', 'vote_count', 'homepage', 'director', 'cast', 'logo_url', 'trailer_url', 'stream_url', 'production_companies', 'status']
  
  for (const key of allowedFields) {
    if (key in movie && movie[key as keyof typeof movie] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(movie[key as keyof typeof movie])
    }
  }
  
  if (fields.length === 0) return
  values.push(id)
  
  const sql = `UPDATE movies SET ${fields.join(', ')} WHERE id = ?`
  await dbQuery(sql, values)
}

export async function deleteMovie(id: string) {
  await dbQuery('DELETE FROM movies WHERE id = ?', [id])
}

export async function upsertMovie(movie: DbMovie) {
  const existing = await dbQuery<DbMovie>('SELECT id FROM movies WHERE tmdb_id = ?', [movie.tmdb_id])
  if (existing.length) {
    await updateMovie(existing[0].id, movie)
  } else {
    await addMovie(movie as any)
  }
}

export async function runMigration() {
  await dbQuery(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    rating REAL NOT NULL,
    genre TEXT NOT NULL,
    poster TEXT NOT NULL,
    backdrop TEXT NOT NULL,
    synopsis TEXT NOT NULL,
    is_trending INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    coming_soon INTEGER DEFAULT 0,
    release_date TEXT,
    quality TEXT,
    duration TEXT,
    type TEXT,
    episodes INTEGER,
    seasons INTEGER,
    tmdb_id INTEGER,
    imdb_id TEXT,
    tagline TEXT,
    runtime INTEGER,
    budget INTEGER,
    revenue INTEGER,
    original_language TEXT,
    popularity REAL,
    vote_count INTEGER,
    homepage TEXT,
    director TEXT,
    cast TEXT,
    logo_url TEXT,
    trailer_url TEXT,
    stream_url TEXT,
    production_companies TEXT,
    status TEXT
  )`)
}

export async function backfillSlugs() {
  const rows = await dbQuery<DbMovie>('SELECT id, title, year FROM movies')
  let count = 0
  for (const row of rows) {
    const targetSlug = slugify(`${row.title} ${row.year}`)
    await dbQuery('UPDATE movies SET slug = ? WHERE id = ?', [targetSlug, row.id])
    count++
  }
  return count
}