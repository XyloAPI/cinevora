import { resolveEpisodeSource } from '../../../src/lib/streamUrls'

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
  if (first?.error) throw new Error(first.error.message || 'Turso query failed')
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
  if (request.method !== 'GET') return jsonError('Method not allowed', 405)

  try {
    const url = new URL(request.url)
    const kv = env.HLS_TOKENS
    const origin = url.origin

    // Token-based lookup (segment / nested playlist)
    const token = url.searchParams.get('t') || ''
    if (token && kv) {
      const upstream = await kv.get(token)
      if (!upstream) return jsonError('Token expired', 404)
      const range = request.headers.get('Range')
      const res = await fetch(upstream, {
        headers: {
          Referer: 'https://fembed.co/',
          'User-Agent': 'Mozilla/5.0',
          ...(range ? { Range: range } : {}),
        },
      })
      if (!res.ok || !res.body) return jsonError(`Upstream responded ${res.status}`, 502)
      const contentType = res.headers.get('content-type') || ''
      const isPlaylist = contentType.includes('mpegurl') || upstream.endsWith('.m3u8')

      if (isPlaylist) {
        const text = await res.text()
        const matches = text.match(/(https?:)?\/\/[^\s"']+/g) || []
        let out = text
        for (const m of matches) {
          const absolute = m.startsWith('//') ? `https:${m}` : m
          try {
            new URL(absolute)
          } catch {
            continue
          }
          const t = crypto.randomUUID()
          await kv.put(t, absolute, { expirationTtl: 86400 })
          out = out.replace(m, `${origin}/api/stream/hls?t=${t}`)
        }
        const headers = new Headers()
        headers.set('Content-Type', 'application/vnd.apple.mpegurl')
        headers.set('Access-Control-Allow-Origin', '*')
        return new Response(out, { status: 200, headers })
      }

      const headers = new Headers()
      headers.set('Content-Type', contentType || 'application/octet-stream')
      headers.set('Access-Control-Allow-Origin', '*')
      const contentLength = res.headers.get('content-length')
      const contentRange = res.headers.get('content-range')
      const acceptRanges = res.headers.get('accept-ranges')
      if (contentLength) headers.set('Content-Length', contentLength)
      if (contentRange) headers.set('Content-Range', contentRange)
      if (acceptRanges) headers.set('Accept-Ranges', acceptRanges)
      return new Response(res.body, {
        status: res.status === 206 ? 206 : 200,
        headers,
      })
    }

    // Entry: resolve from DB
    const movieId = url.searchParams.get('movieId') || ''
    const slot = url.searchParams.get('slot') === '2' ? 2 : 1
    const season = Number(url.searchParams.get('season') || 0)
    const episode = Number(url.searchParams.get('episode') || 0)
    if (!movieId) return jsonError('movieId or t is required', 400)

    const rows = await tursoQuery(env, 'SELECT stream_url, stream_url_2 FROM movies WHERE id = ?', [movieId])
    const movie = rows[0]
    if (!movie) return jsonError('Movie not found', 404)
    const source = resolveEpisodeSource({
      streamUrl: movie.stream_url,
      streamUrl2: movie.stream_url_2,
      season,
      episode,
      slot,
    })
    if (!source) return jsonError('No stream URL', 404)
    if (!source.includes('vdohls.com')) return jsonError('Not an HLS source', 400)

    const range = request.headers.get('Range')
    const upstream = await fetch(source, {
      headers: {
        Referer: 'https://fembed.co/',
        'User-Agent': 'Mozilla/5.0',
        ...(range ? { Range: range } : {}),
      },
    })
    if (!upstream.ok || !upstream.body) return jsonError(`Upstream responded ${upstream.status}`, 502)

    const contentType = upstream.headers.get('content-type') || ''
    const isPlaylist = contentType.includes('mpegurl') || source.endsWith('.m3u8')

    if (isPlaylist) {
      const text = await upstream.text()
      const matches = text.match(/(https?:)?\/\/[^\s"']+/g) || []
      let out = text
      for (const m of matches) {
        const absolute = m.startsWith('//') ? `https:${m}` : m
        try {
          new URL(absolute)
        } catch {
          continue
        }
        const t = crypto.randomUUID()
        if (kv) await kv.put(t, absolute, { expirationTtl: 86400 })
        out = out.replace(m, `${origin}/api/stream/hls?t=${t}`)
      }
      const headers = new Headers()
      headers.set('Content-Type', 'application/vnd.apple.mpegurl')
      headers.set('Access-Control-Allow-Origin', '*')
      return new Response(out, { status: 200, headers })
    }

    const headers = new Headers()
    headers.set('Content-Type', contentType || 'application/octet-stream')
    headers.set('Access-Control-Allow-Origin', '*')
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
    const msg = err instanceof Error ? err.message : 'HLS proxy error'
    return jsonError(msg, 500)
  }
}