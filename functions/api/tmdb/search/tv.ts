import { tmdbFetch } from '../helper'

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

  const tmdbUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=id-ID`
  return tmdbFetch(tmdbUrl, env)
}
