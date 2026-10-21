import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'
import { Readable } from 'stream'
import { resolveEpisodeSource, sanitizeFilename } from './src/lib/streamUrls'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN

// TMDB API routes
app.get('/api/tmdb/trending/:time_window', async (req: any, res: any) => {
  try {
    const { time_window } = req.params
    const url = `${TMDB_BASE}/trending/all/${time_window}?language=id-ID`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/search/movie', async (req: any, res: any) => {
  try {
    const { query, page = 1 } = req.query
    const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query as string)}&page=${page}&language=id-ID`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/movie/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const url = `${TMDB_BASE}/movie/${id}?language=id-ID`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    let data = await response.json()

    if (!data.overview || data.overview.trim() === '') {
      const enUrl = `${TMDB_BASE}/movie/${id}?language=en-US`
      const enResponse = await fetch(enUrl, {
        headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
      })
      if (enResponse.ok) {
        const enData = await enResponse.json()
        data.overview = enData.overview
        if (!data.tagline && enData.tagline) {
          data.tagline = enData.tagline
        }
      }
    }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/movie/:id/credits', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const url = `${TMDB_BASE}/movie/${id}/credits?language=id-ID`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/movie/:id/videos', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const url = `${TMDB_BASE}/movie/${id}/videos`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/movie/:id/images', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const url = `${TMDB_BASE}/movie/${id}/images?include_image_logos=true`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/genre/movie/list', async (req: any, res: any) => {
  try {
    const url = `${TMDB_BASE}/genre/movie/list?language=id-ID`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

app.get('/api/tmdb/discover', async (req: any, res: any) => {
  try {
    const { with_watch_providers, watch_region = 'ID', type = 'movie', page = 1 } = req.query
    const endpoint = type === 'series' || type === 'tv' ? 'tv' : 'movie'
    const url = `${TMDB_BASE}/discover/${endpoint}?with_watch_providers=${with_watch_providers}&watch_region=${watch_region}&sort_by=popularity.desc&page=${page}&language=${watch_region === 'ID' ? 'id-ID' : 'en-US'}`
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    if (!response.ok) throw new Error(`TMDB ${response.status}`)
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

// Turso proxy (passthrough untuk queries yang aman)
app.post('/api/db/query', async (req: any, res: any) => {
  try {
    const { sql, params = [] } = req.body
    const { createClient } = await import('@libsql/client')
    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })
    const result = await db.execute({ sql, args: params })
    res.json({ rows: result.rows })
    db.close()
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Database error' })
  }
})

// Admin Login (local dev)
app.post('/api/admin/login', (req: any, res: any) => {
  try {
    const { username, password } = req.body
    const expectedUser = process.env.ADMIN_USERNAME || 'admin'
    const expectedPass = process.env.ADMIN_PASSWORD || 'Cinevora2026!'

    if (username === expectedUser && password === expectedPass) {
      const token = crypto
        .createHash('sha256')
        .update(expectedPass)
        .digest('hex')
      return res.json({ success: true, token })
    }
    return res.status(401).json({ success: false, error: 'Invalid credentials' })
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid payload' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

function toTursoArgs(params: any[]): any[] {
  return params.map((val: any) => {
    if (val === null || val === undefined) return { type: 'null' }
    if (typeof val === 'boolean') return { type: 'integer', value: val ? '1' : '0' }
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { type: 'integer', value: val.toString() }
      return { type: 'float', value: val }
    }
    if (val && typeof val === 'object' && 'type' in val) return val
    return { type: 'text', value: val.toString() }
  })
}

async function tursoQuery(sql: string, params: any[]): Promise<any[]> {
  const httpUrl = (process.env.TURSO_DATABASE_URL || '').replace('libsql://', 'https://')
  const resp = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: toTursoArgs(params) } }],
    }),
  })
  const data = await resp.json()
  const first = data.results?.[0]
  if (first?.error) {
    throw new Error(first.error.message || 'Turso query failed')
  }
  const result = first?.response?.result
  if (!result) throw new Error('Turso returned no result')
  const cols: { name: string }[] = result.cols || []
  const rawRows: { type: string; value: any }[][] = result.rows || []
  return rawRows.map((row) => Object.fromEntries(cols.map((col, i) => [col.name, row[i]?.value ?? null])))
}

function readParam(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return ''
}

// Download proxy: the browser asks for a movie, the server resolves the CDN url
// from the database so the client can never use this as an open proxy.
app.get('/api/stream/download', async (req: any, res: any) => {
  try {
    const movieId = readParam(req.query.movieId)
    const slot = readParam(req.query.slot) === '2' ? 2 : 1
    const season = Number(readParam(req.query.season) || 0)
    const episode = Number(readParam(req.query.episode) || 0)
    if (!movieId) return res.status(400).json({ error: 'movieId is required' })

    const rows = await tursoQuery('SELECT id, title, stream_url, stream_url_2 FROM movies WHERE id = ?', [movieId])
    const movie = rows[0]
    if (!movie) return res.status(404).json({ error: 'Movie not found' })

    const url = resolveEpisodeSource({
      streamUrl: movie.stream_url,
      streamUrl2: movie.stream_url_2,
      season,
      episode,
      slot,
    })
    if (!url) return res.status(404).json({ error: 'No stream URL for this episode' })

    const range = req.headers.range
    const upstream = await fetch(url, { headers: range ? { Range: range } : {} })
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: `Upstream responded ${upstream.status}` })
    }

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(movie.title)}.mp4"`)
    const contentLength = upstream.headers.get('content-length')
    const contentRange = upstream.headers.get('content-range')
    const acceptRanges = upstream.headers.get('accept-ranges')
    if (contentLength) res.setHeader('Content-Length', contentLength)
    if (contentRange) res.setHeader('Content-Range', contentRange)
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges)
    res.status(upstream.status === 206 ? 206 : 200)
    Readable.fromWeb(upstream.body as any).pipe(res)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Download error' })
  }
})

// Subtitle proxy: keeps the track same-origin so text-track CORS never bites.
app.get('/api/subtitle', async (req: any, res: any) => {
  try {
    const movieId = readParam(req.query.movieId)
    const season = Number(readParam(req.query.season) || 0)
    const episode = Number(readParam(req.query.episode) || 0)
    if (!movieId) return res.status(400).json({ error: 'movieId is required' })

    const rows = await tursoQuery(
      'SELECT url, lang, label, kind FROM episode_subtitles WHERE movie_id = ? AND season_no = ? AND episode_no = ?',
      [movieId, season, episode]
    )
    const row = rows[0]
    if (!row) return res.status(404).json({ error: 'Subtitle not found' })

    const upstream = await fetch(row.url)
    if (!upstream.ok) {
      return res.status(502).json({ error: `Upstream responded ${upstream.status}` })
    }
    const text = await upstream.text()
    const isSrt = row.url.toLowerCase().split('?')[0].endsWith('.srt')
    res.setHeader('Content-Type', isSrt ? 'text/plain; charset=utf-8' : 'text/vtt; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(text)
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Subtitle error' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
  console.log(`TMDB API proxy: http://localhost:${PORT}/api/tmdb/...`)
  console.log(`Database proxy: http://localhost:${PORT}/api/db/query`)
  console.log(`Download proxy: http://localhost:${PORT}/api/stream/download`)
  console.log(`Subtitle proxy: http://localhost:${PORT}/api/subtitle`)
})