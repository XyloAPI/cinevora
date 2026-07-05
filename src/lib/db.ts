import { createClient } from '@libsql/client'
import { slugify } from './utils'

let client: ReturnType<typeof createClient> | null = null

function getDb() {
  if (client) return client

  const url = import.meta.env.VITE_TURSO_DATABASE_URL
  const token = import.meta.env.VITE_TURSO_AUTH_TOKEN

  if (!url) return null

  client = createClient({
    url,
    authToken: token,
  })
  return client
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

const NEW_COLUMNS: [string, string][] = [
  ['tmdb_id', 'INTEGER'],
  ['imdb_id', 'TEXT'],
  ['tagline', 'TEXT'],
  ['runtime', 'INTEGER'],
  ['budget', 'INTEGER'],
  ['revenue', 'INTEGER'],
  ['original_language', 'TEXT'],
  ['popularity', 'REAL'],
  ['vote_count', 'INTEGER'],
  ['homepage', 'TEXT'],
  ['director', 'TEXT'],
  ['slug', 'TEXT'],
  ['cast', 'TEXT'],
  ['logo_url', 'TEXT'],
  ['trailer_url', 'TEXT'],
  ['stream_url', 'TEXT'],
  ['production_companies', 'TEXT'],
  ['status', 'TEXT'],
]

export async function runMigration() {
  const db = getDb()
  if (!db) return false
  for (const [col, type] of NEW_COLUMNS) {
    try {
      await db.execute(`ALTER TABLE movies ADD COLUMN ${col} ${type}`)
    } catch {
      // column already exists
    }
  }
  return true
}

function mapMovie(m: DbMovie) {
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    year: m.year,
    rating: m.rating,
    genre: JSON.parse(m.genre) as string[],
    poster: m.poster,
    backdrop: m.backdrop,
    synopsis: m.synopsis,
    isTrending: Boolean(m.is_trending),
    isFeatured: Boolean(m.is_featured),
    comingSoon: Boolean(m.coming_soon),
    releaseDate: m.release_date ?? undefined,
    quality: m.quality ?? undefined,
    duration: m.duration ?? undefined,
    type: (m.type ?? undefined) as 'movie' | 'series' | undefined,
    episodes: m.episodes ?? undefined,
    seasons: m.seasons ?? undefined,
    tmdbId: m.tmdb_id ?? undefined,
    imdbId: m.imdb_id ?? undefined,
    tagline: m.tagline ?? undefined,
    runtime: m.runtime ?? undefined,
    budget: m.budget ?? undefined,
    revenue: m.revenue ?? undefined,
    originalLanguage: m.original_language ?? undefined,
    popularity: m.popularity ?? undefined,
    voteCount: m.vote_count ?? undefined,
    homepage: m.homepage ?? undefined,
    director: m.director ?? undefined,
    cast: m.cast ? (JSON.parse(m.cast) as string[]) : undefined,
    logoUrl: m.logo_url ?? undefined,
    trailerUrl: m.trailer_url ?? undefined,
    streamUrl: m.stream_url ?? undefined,
    productionCompanies: m.production_companies ? (JSON.parse(m.production_companies) as string[]) : undefined,
    status: m.status ?? undefined,
  }
}

const MOVIE_COLUMNS = `
  "id", "slug", "title", "year", "rating", "genre", "poster", "backdrop", "synopsis",
  "is_trending", "is_featured", "coming_soon", "release_date", "quality", "duration", "type", "episodes", "seasons",
  "tmdb_id", "imdb_id", "tagline", "runtime", "budget", "revenue", "original_language",
  "popularity", "vote_count", "homepage", "director", "cast", "logo_url", "trailer_url", "stream_url",
  "production_companies", "status"
`

const MOVIE_PARAMS = new Array(35).fill('?').join(', ')

export async function fetchAllMovies() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies ORDER BY year DESC, title ASC`)
  return res.rows.map((r) => mapMovie(r as unknown as DbMovie))
}

export async function fetchTrendingMovies() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE is_trending = 1 AND type = 'movie'`)
  return res.rows.map((r) => mapMovie(r as unknown as DbMovie))
}

export async function fetchSeries() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE type = 'series'`)
  return res.rows.map((r) => mapMovie(r as unknown as DbMovie))
}

export async function fetchLatestMovies() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE (type = 'movie' OR type IS NULL) AND is_featured = 0`)
  return res.rows.map((r) => mapMovie(r as unknown as DbMovie))
}

export async function fetchComingSoon() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE coming_soon = 1`)
  return res.rows.map((r) => mapMovie(r as unknown as DbMovie))
}

export async function fetchMovieBySlug(slug: string) {
  const db = getDb()
  if (!db) return null
  const res = await db.execute({
    sql: `SELECT ${MOVIE_COLUMNS} FROM movies WHERE "slug" = ?`,
    args: [slug],
  })
  if (!res.rows.length) {
    const fallback = await db.execute({
      sql: `SELECT ${MOVIE_COLUMNS} FROM movies WHERE LOWER(REPLACE(title, ' ', '-')) = ? LIMIT 1`,
      args: [slug],
    })
    if (!fallback.rows.length) return null
    return mapMovie(fallback.rows[0] as unknown as DbMovie)
  }
  return mapMovie(res.rows[0] as unknown as DbMovie)
}

export async function fetchFeaturedMovie() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`SELECT ${MOVIE_COLUMNS} FROM movies WHERE is_featured = 1 LIMIT 1`)
  if (!res.rows.length) return null
  return mapMovie(res.rows[0] as unknown as DbMovie)
}

export async function fetchMovieByTmdbId(tmdbId: number) {
  const db = getDb()
  if (!db) return null
  const res = await db.execute({
    sql: `SELECT ${MOVIE_COLUMNS} FROM movies WHERE tmdb_id = ? LIMIT 1`,
    args: [tmdbId],
  })
  if (!res.rows.length) return null
  return mapMovie(res.rows[0] as unknown as DbMovie)
}

type MovieInsert = Omit<DbMovie, 'id'> & { id?: string }

function movieToRow(movie: MovieInsert) {
  return [
    movie.id || String(Date.now()),
    movie.slug || slugify(movie.title || ''),
    movie.title, movie.year, movie.rating, movie.genre,
    movie.poster, movie.backdrop, movie.synopsis,
    movie.is_trending, movie.is_featured, movie.coming_soon,
    movie.release_date, movie.quality, movie.duration, movie.type,
    movie.episodes, movie.seasons,
    movie.tmdb_id, movie.imdb_id, movie.tagline, movie.runtime,
    movie.budget, movie.revenue, movie.original_language,
    movie.popularity, movie.vote_count, movie.homepage,
    movie.director, movie.cast, movie.logo_url, movie.trailer_url, movie.stream_url,
    movie.production_companies, movie.status,
  ]
}

export async function addMovie(movie: MovieInsert) {
  const db = getDb()
  if (!db) return null
  const id = movie.id || String(Date.now())
  await db.execute({
    sql: `INSERT INTO movies (${MOVIE_COLUMNS}) VALUES (${MOVIE_PARAMS})`,
    args: movieToRow({ ...movie, id, slug: movie.slug || slugify(movie.title || '') }) as any,
  })
  return id
}

export async function upsertMovie(movie: MovieInsert & { tmdb_id: number }) {
  const db = getDb()
  if (!db) return null
  const existing = movie.tmdb_id ? await fetchMovieByTmdbId(movie.tmdb_id) : null
  if (existing) {
    const { id: _id, tmdb_id: _tmdb, ...updateFields } = movie
    await updateMovie(existing.id, { ...updateFields, slug: movie.slug || slugify(movie.title || '') })
    return existing.id
  }
  return addMovie({ ...movie, slug: movie.slug || slugify(movie.title || '') })
}

const SKIP_UPDATE_KEYS = new Set(['id'])

export async function updateMovie(id: string, fields: Record<string, unknown>) {
  const db = getDb()
  if (!db) return false
  const setClauses: string[] = []
  const values: (string | number | null)[] = []
  for (const [key, value] of Object.entries(fields)) {
    if (SKIP_UPDATE_KEYS.has(key)) continue
    setClauses.push(`"${key}" = ?`)
    values.push(value != null ? (value as string | number) : null)
  }
  if (!setClauses.length) return false
  values.push(id)
  await db.execute({
    sql: `UPDATE movies SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  })
  return true
}

export async function deleteMovie(id: string) {
  const db = getDb()
  if (!db) return false
  await db.execute({ sql: 'DELETE FROM movies WHERE id = ?', args: [id] })
  return true
}

export async function backfillSlugs() {
  const db = getDb()
  if (!db) return 0
  const res = await db.execute(`SELECT id, title, "slug" FROM movies`)
  let updated = 0
  for (const row of res.rows) {
    const id = row.id as string
    const title = row.title as string
    const existingSlug = (row as any).slug as string | null
    const computed = slugify(title)
    if (!existingSlug || existingSlug !== computed) {
      await db.execute({ sql: `UPDATE movies SET "slug" = ? WHERE id = ?`, args: [computed, id] })
      updated++
    }
  }
  return updated
}

export async function getGenres() {
  const db = getDb()
  if (!db) return null
  const res = await db.execute(`
    SELECT genre, COUNT(*) as count FROM (
      SELECT json_each.value as genre FROM movies, json_each(movies.genre)
    ) GROUP BY genre ORDER BY genre ASC
  `)
  return res.rows.map((r) => ({
    name: r.genre as string,
    count: Number(r.count),
    href: `/genres/${String(r.genre).toLowerCase().replace(/\s+/g, '-')}`,
  }))
}
