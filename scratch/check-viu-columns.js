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
      sql: "SELECT * FROM movies WHERE title LIKE '%Bidadari%' OR title LIKE '%Saudade%'",
      args: []
    })
    console.log('MOVIES DATA:', JSON.stringify(res.rows, null, 2))
  } catch (e) {
    console.error('Error running check:', e)
  } finally {
    db.close()
  }
}

run()
