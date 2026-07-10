import dotenv from 'dotenv'

dotenv.config()

const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN

async function run() {
  try {
    const url = 'https://api.themoviedb.org/3/watch/providers/movie?watch_region=ID&language=id-ID'
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TMDB_TOKEN}` }
    })
    const data = await res.json()
    const platforms = ['Netflix', 'Disney', 'Viu', 'Prime Video', 'HBO', 'Apple TV']
    
    console.log('TMDB watch providers in Indonesia:')
    for (const p of data.results) {
      if (platforms.some(name => p.provider_name.toLowerCase().includes(name.toLowerCase()))) {
        console.log(`- ${p.provider_name}: ID = ${p.provider_id}`)
      }
    }
  } catch (e) {
    console.error('Error:', e)
  }
}

run()
