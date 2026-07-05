export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { sql, params = [] } = await request.json()

    // Convert libsql:// URL to HTTPS for HTTP API
    const httpUrl = env.TURSO_DATABASE_URL.replace('libsql://', 'https://')
    const resp = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ type: 'execute', stmt: { sql, args: params } }],
      }),
    })

    const data = await resp.json()
    const result = data.results?.[0]?.response?.result
    const cols: { name: string }[] = result?.cols || []
    const rawRows: { type: string; value: any }[][] = result?.rows || []

    // Map array-of-arrays to array-of-objects using column names
    const rows = rawRows.map((row) =>
      Object.fromEntries(cols.map((col, i) => [col.name, row[i]?.value ?? null]))
    )

    return new Response(JSON.stringify({ rows }), {
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