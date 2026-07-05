import { tmdbFetch } from '../../helper'

export async function onRequest(context) {
  const { env } = context
  const url = `https://api.themoviedb.org/3/genre/movie/list?language=id-ID`
  return tmdbFetch(url, env)
}