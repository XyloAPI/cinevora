export async function tmdbFetch(urlStr: string, env: any): Promise<Response> {
  const token = env.TMDB_READ_ACCESS_TOKEN || env.VITE_TMDB_READ_ACCESS_TOKEN
  const apiKey = env.TMDB_API_KEY || env.VITE_TMDB_API_KEY

  const url = new URL(urlStr)
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else if (apiKey) {
    url.searchParams.set('api_key', apiKey)
  }

  const resp = await fetch(url.toString(), { headers })
  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
