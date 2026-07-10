import dotenv from 'dotenv'

dotenv.config()

const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN

async function run() {
  try {
    const ids = [286794, 325416] // Saudade, Bidadari Tanpa Syurga
    for (const id of ids) {
      const url = `https://api.themoviedb.org/3/tv/${id}?language=en-US`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
      })
      if (!res.ok) {
        console.log(`Failed to fetch TV details for ${id}: status ${res.status}`)
        continue
      }
      const data = await res.json()
      console.log(`\n=== TV DETAILS FOR "${data.name}" (TMDB ID ${id}) ===`)
      console.log('Networks:', data.networks?.map(n => ({ id: n.id, name: n.name })))
      console.log('Production Companies:', data.production_companies?.map(p => ({ id: p.id, name: p.name })))
    }
  } catch (e) {
    console.error('Error:', e)
  }
}

run()
