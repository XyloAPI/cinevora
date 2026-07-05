import { createClient } from '@libsql/client'

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { sql, params = [] } = await request.json()

    const db = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    })

    const result = await db.execute({ sql, args: params })
    await db.close()

    return new Response(JSON.stringify({ rows: result.rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
}