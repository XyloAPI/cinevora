import { tmdbFetch } from './helper'

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const watchRegion = url.searchParams.get('watch_region') || 'ID'
  const withWatchProviders = url.searchParams.get('with_watch_providers') || ''
  const sortBy = url.searchParams.get('sort_by') || 'popularity.desc'
  const type = url.searchParams.get('type') || 'movie'
  const page = url.searchParams.get('page') || '1'
  const language = url.searchParams.get('language') || (watchRegion === 'ID' ? 'id-ID' : 'en-US')

  const endpoint = type === 'series' || type === 'tv' ? 'tv' : 'movie'
  const tmdbUrl = new URL(`https://api.themoviedb.org/3/discover/${endpoint}`)

  tmdbUrl.searchParams.set('page', page)
  tmdbUrl.searchParams.set('sort_by', sortBy)
  
  if (watchRegion) {
    tmdbUrl.searchParams.set('watch_region', watchRegion)
  }
  if (withWatchProviders) {
    tmdbUrl.searchParams.set('with_watch_providers', withWatchProviders)
  }
  if (language) {
    tmdbUrl.searchParams.set('language', language)
  }

  return tmdbFetch(tmdbUrl.toString(), env)
}
