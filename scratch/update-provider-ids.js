import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  try {
    console.log('Updating provider_id for Saudade and Bidadari Tanpa Syurga to 158 (Viu)...')
    const res = await db.execute({
      sql: "UPDATE movies SET provider_id = 158 WHERE tmdb_id IN (286794, 325416)",
      args: []
    })
    console.log(`Update complete! Rows affected: ${res.rowsAffected}`)
  } catch (e) {
    console.error('Error executing query:', e)
  } finally {
    db.close()
  }
}

run()
