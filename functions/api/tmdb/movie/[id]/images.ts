import { tmdbFetch } from '../../helper'

export async function onRequest(context) {
  const { env, params } = context
  const { id } = params
  const url = `https://api.themoviedb.org/3/movie/${id}/images?include_image_logos=true`
  return tmdbFetch(url, env)
}