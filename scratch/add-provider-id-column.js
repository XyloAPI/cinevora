import dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  try {
    console.log('Adding provider_id column to movies table...')
    await db.execute("ALTER TABLE movies ADD COLUMN provider_id INTEGER")
    console.log('Column added successfully!')
  } catch (e) {
    console.error('Error (might already exist):', e.message)
  } finally {
    db.close()
  }
}

run()
