import { tmdbFetch } from '../../helper'

export async function onRequest(context) {
  const { env, params } = context
  const { id } = params
  const url = `https://api.themoviedb.org/3/tv/${id}/credits?language=id-ID`
  return tmdbFetch(url, env)
}
