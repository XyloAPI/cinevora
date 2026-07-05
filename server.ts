import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crypto from 'crypto'

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
    const data = await response.json()
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
    const url = `${TMDB_BASE}/movie/${id}/videos?language=id-ID`
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
  console.log(`TMDB API proxy: http://localhost:${PORT}/api/tmdb/...`)
  console.log(`Database proxy: http://localhost:${PORT}/api/db/query`)
})