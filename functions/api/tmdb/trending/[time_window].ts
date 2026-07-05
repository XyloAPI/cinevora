import { tmdbFetch } from '../helper'

export async function onRequest(context) {
  const { env, params } = context
  const { time_window } = params
  const url = `https://api.themoviedb.org/3/trending/all/${time_window}?language=id-ID`
  return tmdbFetch(url, env)
}