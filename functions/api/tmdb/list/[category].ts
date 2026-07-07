import { tmdbFetch } from '../helper'

export async function onRequest(context) {
  const { request, env, params } = context
  const { category } = params
  const url = new URL(request.url)
  const region = url.searchParams.get('region') || ''
  const page = url.searchParams.get('page') || '1'
  const timeWindow = url.searchParams.get('time_window') || 'week' // 'day' | 'week'
  const language = url.searchParams.get('language') || (region === 'ID' ? 'id-ID' : 'en-US')

  let tmdbUrl = ''

  if (category === 'now_playing') {
    tmdbUrl = `https://api.themoviedb.org/3/movie/now_playing?page=${page}`
  } else if (category === 'popular') {
    tmdbUrl = `https://api.themoviedb.org/3/movie/popular?page=${page}`
  } else if (category === 'top_rated') {
    tmdbUrl = `https://api.themoviedb.org/3/movie/top_rated?page=${page}`
  } else if (category === 'trending') {
    if (region) {
      tmdbUrl = `https://api.themoviedb.org/3/movie/popular?page=${page}`
    } else {
      tmdbUrl = `https://api.themoviedb.org/3/trending/movie/${timeWindow}?page=${page}`
    }
  } else {
    return new Response(JSON.stringify({ error: 'Invalid category' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const targetUrl = new URL(tmdbUrl)
  if (region) {
    targetUrl.searchParams.set('region', region)
  }
  if (language) {
    targetUrl.searchParams.set('language', language)
  }

  return tmdbFetch(targetUrl.toString(), env)
}
