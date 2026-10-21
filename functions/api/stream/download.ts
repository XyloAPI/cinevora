import { resolveEpisodeSource, sanitizeFilename } from '../../../src/lib/streamUrls'

function toTursoArgs(params: any[]): any[] {
  return params.map((val: any) => {
    if (val === null || val === undefined) return { type: 'null' }
    if (typeof val === 'boolean') return { type: 'integer', value: val ? '1' : '0' }
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { type: 'integer', value: val.toString() }
      return { type: 'float', value: val }
    }
    if (val && typeof val === 'object' && 'type' in val) return val
    return { type: 'text', value: val.toString() }
  })
}

async function tursoQuery(env: any, sql: string, params: any[]): Promise<any[]> {
  const httpUrl = (env.TURSO_DATABASE_URL || '').replace('libsql://', 'https://')
  const resp = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: toTursoArgs(params) } }],
    }),
  })
  const data = await resp.json()
  const first = data.results?.[0]
  if (first?.error) {
    throw new Error(first.error.message || 'Turso query failed')
  }
  const result = first?.response?.result
  if (!result) throw new Error('Turso returned no result')
  const cols: { name: string }[] = result.cols || []
  const rawRows: { type: string; value: any }[][] = result.rows || []
  return rawRows.map((row) => Object.fromEntries(cols.map((col, i) => [col.name, row[i]?.value ?? null])))
}

function jsonError(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequest(context: any) {
  const { request, env } = context

  if (request.method !== 'GET') {
    return jsonError('Method not allowed', 405)
  }

  try {
    const url = new URL(request.url)
    const movieId = url.searchParams.get('movieId') || ''
    const slot = url.searchParams.get('slot') === '2' ? 2 : 1
    const season = Number(url.searchParams.get('season') || 0)
    const episode = Number(url.searchParams.get('episode') || 0)
    if (!movieId) return jsonError('movieId is required', 400)

    const rows = await tursoQuery(
      env,
      'SELECT id, title, stream_url, stream_url_2 FROM movies WHERE id = ?',
      [movieId]
    )
    const movie = rows[0]
    if (!movie) return jsonError('Movie not found', 404)

    const source = resolveEpisodeSource({
      streamUrl: movie.stream_url,
      streamUrl2: movie.stream_url_2,
      season,
      episode,
      slot,
    })
    if (!source) return jsonError('No stream URL for this episode', 404)

    const range = request.headers.get('Range')
    const upstream = await fetch(source, { headers: range ? { Range: range } : {} })
    if (!upstream.ok || !upstream.body) {
      return jsonError(`Upstream responded ${upstream.status}`, 502)
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(movie.title)}.mp4"`)
    const contentLength = upstream.headers.get('content-length')
    const contentRange = upstream.headers.get('content-range')
    const acceptRanges = upstream.headers.get('accept-ranges')
    if (contentLength) headers.set('Content-Length', contentLength)
    if (contentRange) headers.set('Content-Range', contentRange)
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges)

    return new Response(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Download error'
    return jsonError(msg, 500)
  }
}
