import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config({ path: '.env.server' })

const app = express()
const PORT = process.env.PORT || 3001

const db = createClient({
  url: process.env.VITE_TURSO_DATABASE_URL!,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
})

app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Proxy TMDB requests
app.get('/api/tmdb/*', async (req, res) => {
  try {
    const endpoint = req.params[0] as string
    const url = `https://api.themoviedb.org/3/${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_TMDB_READ_ACCESS_TOKEN}`,
      },
    })
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'TMDB API error' })
  }
})

// Proxy database queries
app.get('/api/movies', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM movies ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

app.get('/api/movies/:slug', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM movies WHERE slug = ?', [req.params.slug])
    res.json(result.rows[0] || null)
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

app.post('/api/movies', async (req, res) => {
  try {
    const { id, ...data } = req.body
    const fields = Object.keys(data)
    const values = Object.values(data)
    const placeholders = fields.map(() => '?').join(', ')
    
    await db.execute(
      `INSERT INTO movies (id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
      [id, ...values]
    )
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

app.put('/api/movies/:id', async (req, res) => {
  try {
    const data = req.body as Record<string, any>
    const fields = Object.keys(data)
    const values = Object.values(data).map((v) => v ?? null)
    const setClause = fields.map((f) => `${f} = ?`).join(', ')
    
    await db.execute(
      `UPDATE movies SET ${setClause} WHERE id = ?`,
      [...values, req.params.id]
    )
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

app.delete('/api/movies/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM movies WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Database error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})