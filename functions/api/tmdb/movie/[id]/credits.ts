export async function onRequest(context) {
  const { env, params } = context
  const { id } = params
  const url = `https://api.themoviedb.org/3/movie/${id}/credits?language=id-ID`
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${env.TMDB_READ_ACCESS_TOKEN}` },
  })
  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' },
  })
}