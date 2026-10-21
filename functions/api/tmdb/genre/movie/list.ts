import { tmdbFetch } from '../../helper'

export async function onRequest(context) {
  const { env } = context
  const url = `https://api.themoviedb.org/3/genre/movie/list?language=en-US`
  return tmdbFetch(url, env)
}