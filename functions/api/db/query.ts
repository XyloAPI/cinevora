async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function isReadOnlyQuery(sql: string): boolean {
  const normalized = sql.trim().toLowerCase()
  if (!normalized.startsWith('select')) {
    return false
  }
  if (normalized.includes(';')) {
    const parts = normalized.split(';')
    if (parts.slice(1).some((p) => p.trim().length > 0)) {
      return false
    }
  }
  const forbidden = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'replace', 'upsert']
  for (const keyword of forbidden) {
    const regex = new RegExp(`\\b${keyword}\\b`)
    if (regex.test(normalized)) {
      return false
    }
  }
  return true
}

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

    // Validate SQL execution privileges
    const sqlNormalized = sql || ''
    if (!isReadOnlyQuery(sqlNormalized)) {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const token = authHeader.substring(7)
      const adminPass = env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD
      if (!adminPass) {
        return new Response(JSON.stringify({ error: 'Admin credentials not configured on server' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      const expectedToken = await sha256(adminPass)
      if (token !== expectedToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Map raw JS params to Turso type-value parameter objects
    const tursoArgs = params.map((val: any) => {
      if (val === null || val === undefined) {
        return { type: 'null' }
      }
      if (typeof val === 'boolean') {
        return { type: 'integer', value: val ? '1' : '0' }
      }
      if (typeof val === 'number') {
        if (Number.isInteger(val)) {
          return { type: 'integer', value: val.toString() }
        }
        return { type: 'float', value: val }
      }
      if (val && typeof val === 'object' && 'type' in val) {
        return val
      }
      return { type: 'text', value: val.toString() }
    })

    // Convert libsql:// URL to HTTPS for HTTP API
    const httpUrl = env.TURSO_DATABASE_URL.replace('libsql://', 'https://')
    const resp = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ type: 'execute', stmt: { sql, args: tursoArgs } }],
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