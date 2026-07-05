import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { createClient } from '@libsql/client'
import { genres } from '../data/movies'
import type { Movie } from '../types'

// Fallback: re-create static movies for seeding
const movies: Movie[] = []

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

const url = process.env.VITE_TURSO_DATABASE_URL!
const token = process.env.VITE_TURSO_AUTH_TOKEN!

console.log('URL:', url)
console.log('Token length:', token?.length)

async function seed() {
  const db = createClient({ url, authToken: token })

  await db.execute(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      rating REAL NOT NULL,
      genre TEXT NOT NULL,
      poster TEXT NOT NULL,
      backdrop TEXT NOT NULL,
      synopsis TEXT NOT NULL,
      is_trending INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      coming_soon INTEGER NOT NULL DEFAULT 0,
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
      trailer_url TEXT,
      stream_url TEXT,
      production_companies TEXT,
      status TEXT
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS genres (
      name TEXT PRIMARY KEY,
      count INTEGER NOT NULL
    )
  `)

  const cols = [
    'id', 'title', 'year', 'rating', 'genre', 'poster', 'backdrop', 'synopsis',
    'is_trending', 'is_featured', 'coming_soon', 'release_date', 'quality', 'duration', 'type',
    'episodes', 'seasons',
    'tmdb_id', 'imdb_id', 'tagline', 'runtime', 'budget', 'revenue', 'original_language',
    'popularity', 'vote_count', 'homepage', 'director', 'cast', 'trailer_url', 'stream_url',
    'production_companies', 'status',
  ]
  const placeholders = cols.map(() => '?').join(', ')

  for (const m of movies) {
    await db.execute({
      sql: `INSERT OR REPLACE INTO movies (${cols.join(', ')}) VALUES (${placeholders})`,
      args: [
        m.id, m.title, m.year, m.rating, JSON.stringify(m.genre),
        m.poster, m.backdrop, m.synopsis,
        m.isTrending ? 1 : 0, m.isFeatured ? 1 : 0, m.comingSoon ? 1 : 0,
        m.releaseDate ?? null, m.quality ?? null, m.duration ?? null,
        m.type ?? null, m.episodes ?? null, m.seasons ?? null,
        m.tmdbId ?? null, m.imdbId ?? null, m.tagline ?? null, m.runtime ?? null,
        m.budget ?? null, m.revenue ?? null, m.originalLanguage ?? null,
        m.popularity ?? null, m.voteCount ?? null, m.homepage ?? null,
        m.director ?? null, JSON.stringify(m.cast) ?? null, m.trailerUrl ?? null,
        m.streamUrl ?? null,
        m.productionCompanies ? JSON.stringify(m.productionCompanies) : null,
        m.status ?? null,
      ],
    })
  }

  for (const g of genres) {
    await db.execute({
      sql: 'INSERT OR REPLACE INTO genres (name, count) VALUES (?, ?)',
      args: [g.name, g.count],
    })
  }

  console.log(`Seeded ${movies.length} movies and ${genres.length} genres`)
  db.close()
}

seed().catch(console.error)
