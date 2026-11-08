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
    const token = url.searchParams.get('t') || ''
    let source = ''
    if (token) {
      const secret = env.HLS_PROXY_SECRET || 'cinevora-hls-secret'
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32)), 'AES-GCM', false, ['decrypt'])
      const raw = token.replace(/-/g, '+').replace(/_/g, '/')
      const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4)
      const binary = atob(padded)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const iv = bytes.slice(0, 12)
      const ct = bytes.slice(12)
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
      source = new TextDecoder().decode(pt)
    } else {
      const targetUrl = url.searchParams.get('url') || ''
      source = targetUrl
    }
    if (!source) {
      const movieId = url.searchParams.get('movieId') || ''
      const slot = url.searchParams.get('slot') === '2' ? 2 : 1
      const season = Number(url.searchParams.get('season') || 0)
      const episode = Number(url.searchParams.get('episode') || 0)
      if (!movieId) return jsonError('movieId or url is required', 400)
      const rows = await tursoQuery(env, 'SELECT stream_url, stream_url_2 FROM movies WHERE id = ?', [movieId])
      const movie = rows[0]
      if (!movie) return jsonError('Movie not found', 404)
      const resolved = resolveEpisodeSource({
        streamUrl: movie.stream_url,
        streamUrl2: movie.stream_url_2,
        season,
        episode,
        slot,
      })
      if (!resolved) return jsonError('No stream URL', 404)
      source = resolved
    }
    if (!source.includes('vdohls.com')) return jsonError('Not an HLS source', 400)

    const range = request.headers.get('Range')
    const upstream = await fetch(source, {
      headers: {
        Referer: 'https://fembed.co/',
        'User-Agent': 'Mozilla/5.0',
        ...(range ? { Range: range } : {}),
      },
    })
    if (!upstream.ok || !upstream.body) {
      return jsonError(`Upstream responded ${upstream.status}`, 502)
    }

    const contentType = upstream.headers.get('content-type') || ''
    const isPlaylist = contentType.includes('mpegurl') || source.endsWith('.m3u8')

    if (isPlaylist) {
      const text = await upstream.text()
      const origin = new URL(request.url).origin
      const secret = env.HLS_PROXY_SECRET || 'cinevora-hls-secret'
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32)), 'AES-GCM', false, ['encrypt'])
      const encrypt = async (plain: string) => {
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
        const bytes = new Uint8Array(iv.byteLength + ct.byteLength)
        bytes.set(iv, 0)
        bytes.set(new Uint8Array(ct), iv.byteLength)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
        return btoa(binary).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
      }
      const matches = text.match(/(https?:)?\/\/vdohls\.com\/[^\s"']+/g) || []
      let out = text
      for (const m of matches) {
        const absolute = m.startsWith('//') ? `https:${m}` : m
        const t = await encrypt(absolute)
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