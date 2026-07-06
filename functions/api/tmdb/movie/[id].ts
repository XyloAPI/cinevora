import { tmdbFetch } from '../helper'

export async function onRequest(context) {
  const { env, params } = context
  const { id } = params
  const url = `https://api.themoviedb.org/3/movie/${id}?language=id-ID`
  const res = await tmdbFetch(url, env)
  if (res.status === 200) {
    const data = await res.clone().json()
    if (!data.overview || data.overview.trim() === '') {
      const enUrl = `https://api.themoviedb.org/3/movie/${id}?language=en-US`
      const enRes = await tmdbFetch(enUrl, env)
      if (enRes.status === 200) {
        return enRes
      }
    }
  }
  return res
}