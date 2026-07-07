import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createClient } from '@libsql/client'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envFile = readFileSync(resolve(__dirname, '../../.env'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && !process.env[key]) {
      process.env[key] = rest.join('=').trim()
    }
  }
}
loadEnv()

const DB_URL = process.env.VITE_TURSO_DATABASE_URL!
const DB_TOKEN = process.env.VITE_TURSO_AUTH_TOKEN!
const TMDB_TOKEN = process.env.VITE_TMDB_READ_ACCESS_TOKEN!
const TMDB_KEY = process.env.VITE_TMDB_API_KEY!
const IMG_BASE = 'https://image.tmdb.org/t/p'
const API_BASE = 'https://api.themoviedb.org/3'

interface TmdbPage<T> {
  results: T[]
  total_results: number
  total_pages: number
  page: number
}

interface TmdbMovie {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  poster_path: string | null
  backdrop_path: string | null
  genre_ids: number[]
  original_language: string
}

interface TmdbDetail {
  id: number
  title: string
  overview: string
  tagline: string
  release_date: string
  runtime: number | null
  vote_average: number
  vote_count: number
  popularity: number
  poster_path: string | null
  backdrop_path: string | null
  budget: number
  revenue: number
  homepage: string | null
  imdb_id: string | null
  original_language: string
  status: string
  genres: { id: number; name: string }[]
  production_companies: { id: number; name: string }[]
}

interface TmdbVideo {
  key: string
  site: string
  type: string
  name: string
  official: boolean
}

interface TmdbCredit {
  cast: { id: number; name: string; character: string; order: number }[]
  crew: { id: number; name: string; job: string }[]
}

interface TmdbGenre {
  id: number
  name: string
}

const genreMap = new Map<number, string>()
let genreList: TmdbGenre[] = []

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`)
  return res.json()
}

function imgPath(path: string | null, size = 'w500'): string {
  return path ? `${IMG_BASE}/${size}${path}` : ''
}

function imgOriginal(path: string | null): string {
  return path ? `${IMG_BASE}/original${path}` : ''
}

async function loadGenres() {
  if (genreList.length) return
  const data = await fetchJson<{ genres: TmdbGenre[] }>(`${API_BASE}/genre/movie/list?language=en-US`)
  genreList = data.genres
  for (const g of data.genres) genreMap.set(g.id, g.name)
}

function getGenreNames(ids: number[]): string[] {
  return ids.map((id) => genreMap.get(id) || 'Unknown')
}

async function getMovieDetail(id: number): Promise<TmdbDetail> {
  return fetchJson<TmdbDetail>(`${API_BASE}/movie/${id}?language=en-US`)
}

async function getMovieVideos(id: number): Promise<TmdbVideo[]> {
  const data = await fetchJson<{ results: TmdbVideo[] }>(`${API_BASE}/movie/${id}/videos?language=en-US`)
  return data.results
}

async function getMovieCredits(id: number): Promise<TmdbCredit> {
  return fetchJson<TmdbCredit>(`${API_BASE}/movie/${id}/credits?language=en-US`)
}

interface TmdbImage {
  file_path: string
  iso_639_1: string | null
}

async function getMovieImages(id: number): Promise<TmdbImage[]> {
  const data = await fetchJson<{ logos: TmdbImage[] }>(`${API_BASE}/movie/${id}/images?include_image_language=en,null`)
  return data.logos
}

function findLogo(logos: TmdbImage[]): string | undefined {
  const en = logos.find((l) => l.iso_639_1 === 'en') || logos[0]
  return en ? `https://image.tmdb.org/t/p/original${en.file_path}` : undefined
}

function findTrailer(videos: TmdbVideo[]): string | undefined {
  const t = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official)
    || videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
  return t ? `https://www.youtube.com/watch?v=${t.key}` : undefined
}

function findDirector(credits: TmdbCredit): string | undefined {
  return credits.crew.find((c) => c.job === 'Director')?.name
}

type Source = 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'upcoming'

async function fetchSource(source: Source, page: number): Promise<TmdbMovie[]> {
  const url = source === 'trending'
    ? `${API_BASE}/trending/movie/week?language=id-ID&page=${page}`
    : `${API_BASE}/movie/${source}?language=en-US&page=${page}`
  const data = await fetchJson<TmdbPage<TmdbMovie>>(url)
  return data.results
}

async function scrapeAndSeed(
  db: ReturnType<typeof createClient>,
  source: Source,
  pages: number,
  limit: number,
  onProgress?: (done: number, total: number, title: string) => void,
) {
  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  const cols = [
    '"id"', '"slug"', '"title"', '"year"', '"rating"', '"genre"', '"poster"', '"backdrop"', '"synopsis"',
    '"is_trending"', '"is_featured"', '"coming_soon"', '"release_date"', '"quality"', '"duration"', '"type"',
    '"episodes"', '"seasons"',
    '"tmdb_id"', '"imdb_id"', '"tagline"', '"runtime"', '"budget"', '"revenue"', '"original_language"',
    '"popularity"', '"vote_count"', '"homepage"', '"director"', '"cast"', '"logo_url"', '"trailer_url"', '"stream_url"',
    '"production_companies"', '"status"',
  ]
  const placeholders = cols.map(() => '?').join(', ')

  await loadGenres()

  let totalAdded = 0
  const seen = new Set<number>()

  for (let p = 1; p <= pages; p++) {
    const movies = await fetchSource(source, p)
    if (!movies.length) break

    for (const m of movies) {
      if (seen.has(m.id) || totalAdded >= limit) continue
      seen.add(m.id)

      onProgress?.(totalAdded, limit, m.title)

      try {
        const [detail, videos, credits, images] = await Promise.all([
          getMovieDetail(m.id),
          getMovieVideos(m.id),
          getMovieCredits(m.id),
          getMovieImages(m.id),
        ])

        const year = detail.release_date ? new Date(detail.release_date).getFullYear() : new Date().getFullYear()
        const runtimeMins = detail.runtime
        const hours = runtimeMins ? Math.floor(runtimeMins / 60) : 0
        const mins = runtimeMins ? runtimeMins % 60 : 0
        const durationStr = runtimeMins ? `${hours}h ${mins}m` : null
        const genreNames = getGenreNames(m.genre_ids)
        const castList = credits.cast.slice(0, 10).map((c) => c.name)
        const trailer = findTrailer(videos)
        const director = findDirector(credits)
        const logoUrl = findLogo(images)

        const id = `tmdb-${detail.id}`

        const existing = await db.execute({
          sql: 'SELECT id FROM movies WHERE tmdb_id = ? LIMIT 1',
          args: [detail.id],
        })

        if (existing.rows.length) {
          const existingId = existing.rows[0].id as string
          const setClauses = cols.filter((c) => c !== '"id"').map((c) => `${c} = ?`).join(', ')
          const values = [
            slugify(`${detail.title} ${year}`), detail.title, year, detail.vote_average, JSON.stringify(genreNames),
            imgPath(detail.poster_path), imgOriginal(detail.backdrop_path), detail.overview,
            0, 0, 0,
            detail.release_date || null, null, durationStr, 'movie',
            null, null,
            detail.id, detail.imdb_id || null, detail.tagline || null, runtimeMins,
            detail.budget || 0, detail.revenue || 0, detail.original_language,
            detail.popularity, detail.vote_count, detail.homepage || null,
            director || null, JSON.stringify(castList), logoUrl || null, trailer || null, null,
            JSON.stringify(detail.production_companies.map((c) => c.name)),
            detail.status || null,
            existingId,
          ]
          await db.execute({
            sql: `UPDATE movies SET ${setClauses} WHERE id = ?`,
            args: values,
          })
        } else {
          const values = [
            id, slugify(`${detail.title} ${year}`), detail.title, year, detail.vote_average, JSON.stringify(genreNames),
            imgPath(detail.poster_path), imgOriginal(detail.backdrop_path), detail.overview,
            0, 0, 0,
            detail.release_date || null, null, durationStr, 'movie',
            null, null,
            detail.id, detail.imdb_id || null, detail.tagline || null, runtimeMins,
            detail.budget || 0, detail.revenue || 0, detail.original_language,
            detail.popularity, detail.vote_count, detail.homepage || null,
            director || null, JSON.stringify(castList), logoUrl || null, trailer || null, null,
            JSON.stringify(detail.production_companies.map((c) => c.name)),
            detail.status || null,
          ]
          await db.execute({
            sql: `INSERT OR REPLACE INTO movies (${cols.join(', ')}) VALUES (${placeholders})`,
            args: values,
          })
        }

        totalAdded++
      } catch (err) {
        console.error(`  Failed to process "${m.title}" (ID: ${m.id}):`, (err as Error).message)
      }
    }
  }

  return totalAdded
}

async function main() {
  const source = (process.argv[2] || 'trending') as Source
  const pages = parseInt(process.argv[3] || '1', 10)
  const limit = parseInt(process.argv[4] || '20', 10)

  console.log(`\nTMDB Scraper`)
  console.log(`  Source: ${source}`)
  console.log(`  Pages: ${pages}`)
  console.log(`  Limit: ${limit} movies\n`)

  const db = createClient({ url: DB_URL, authToken: DB_TOKEN })

  const newCols: [string, string][] = [
    ['slug', 'TEXT'],
    ['tmdb_id', 'INTEGER'], ['imdb_id', 'TEXT'], ['tagline', 'TEXT'],
    ['runtime', 'INTEGER'], ['budget', 'INTEGER'], ['revenue', 'INTEGER'],
    ['original_language', 'TEXT'], ['popularity', 'REAL'], ['vote_count', 'INTEGER'],
    ['homepage', 'TEXT'], ['director', 'TEXT'], ['cast', 'TEXT'],
    ['trailer_url', 'TEXT'], ['stream_url', 'TEXT'],
    ['production_companies', 'TEXT'], ['status', 'TEXT'],
  ]
  for (const [col, type] of newCols) {
    try { await db.execute(`ALTER TABLE movies ADD COLUMN ${col} ${type}`) } catch { }
  }

  let done = 0
  const totalAdded = await scrapeAndSeed(db, source, pages, limit, (d, t, title) => {
    done = d
    process.stdout.write(`\r  [${done + 1}/${t}] ${title.padEnd(50)}`)
  })

  console.log(`\n\nDone! Added/updated ${totalAdded} movies.`)
  db.close()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
