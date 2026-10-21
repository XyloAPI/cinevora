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

import { computeSubtitleEtag, etagMatches } from '../../../src/lib/subtitleCache'

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
    const season = Number(url.searchParams.get('season') || 0)
    const episode = Number(url.searchParams.get('episode') || 0)
    if (!movieId) return jsonError('movieId is required', 400)

    const rows = await tursoQuery(
      env,
      'SELECT url, lang, label, kind FROM episode_subtitles WHERE movie_id = ? AND season_no = ? AND episode_no = ?',
      [movieId, season, episode]
    )
    const row = rows[0]
    if (!row) return jsonError('Subtitle not found', 404)

    const upstream = await fetch(row.url)
    if (!upstream.ok) {
      return jsonError(`Upstream responded ${upstream.status}`, 502)
    }
    const text = await upstream.text()
    const etag = computeSubtitleEtag({
      upstreamEtag: upstream.headers.get('etag'),
      content: text,
    })

    const headers = new Headers()
    headers.set('ETag', etag)
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'no-cache')

    if (etagMatches(request.headers.get('If-None-Match'), etag)) {
      return new Response(null, { status: 304, headers })
    }

    const isSrt = row.url.toLowerCase().split('?')[0].endsWith('.srt')
    headers.set('Content-Type', isSrt ? 'text/plain; charset=utf-8' : 'text/vtt; charset=utf-8')

    return new Response(text, { status: 200, headers })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subtitle error'
    return jsonError(msg, 500)
  }
}
