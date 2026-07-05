export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const query = url.searchParams.get('query')
  const page = url.searchParams.get('page') || '1'

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=id-ID`
  const resp = await fetch(tmdbUrl, {
    headers: { Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}` },
  })
  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  })
}