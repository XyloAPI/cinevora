import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  try {
    const res = await db.execute({
      sql: "SELECT id, title, tmdb_id, type FROM movies WHERE title LIKE '%Bidadari%' OR title LIKE '%Saudade%'",
      args: []
    })
    console.log('MOVIES FOUND IN TURSO:', res.rows)

    const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN
    
    for (const row of res.rows) {
      const tmdbId = row.tmdb_id
      if (!tmdbId) {
        console.log(`Movie ${row.title} has no TMDB ID!`)
        continue
      }
      
      const type = row.type === 'series' ? 'tv' : 'movie'
      const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/watch/providers`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
      })
      
      if (!response.ok) {
        console.log(`Failed to fetch watch providers for ${row.title} (TMDB ID ${tmdbId}): status ${response.status}`)
        continue
      }
      
      const data = await response.json()
      console.log(`\n=== WATCH PROVIDERS FOR "${row.title}" (TMDB ID ${tmdbId}) ===`)
      console.log('ID Providers (Indonesia):', JSON.stringify(data.results?.ID || null, null, 2))
      console.log('MY Providers (Malaysia):', JSON.stringify(data.results?.MY || null, null, 2))
      console.log('All available regions:', Object.keys(data.results || {}))
    }
  } catch (e) {
    console.error('Error running check:', e)
  } finally {
    db.close()
  }
}

run()
