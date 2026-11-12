type TursoValue = string | number | boolean | null

function toTursoArgs(params: TursoValue[]) {
  return params.map((value) => {
    if (value === null) return { type: 'null' }
    if (typeof value === 'boolean') return { type: 'integer', value: value ? '1' : '0' }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { type: 'integer', value: value.toString() }
        : { type: 'float', value }
    }
    return { type: 'text', value }
  })
}

export async function tursoQuery(
  env: Record<string, string | undefined>,
  sql: string,
  params: TursoValue[] = []
): Promise<Record<string, unknown>[]> {
  const databaseUrl = env.TURSO_DATABASE_URL
  const authToken = env.TURSO_AUTH_TOKEN
  if (!databaseUrl || !authToken) {
    throw new Error('Database credentials are not configured')
  }

  const httpUrl = databaseUrl.replace(/^libsql:\/\//, 'https://').replace(/\/+$/, '')
  const response = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: toTursoArgs(params) } }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Database request failed: ${response.status}`)
  }

  const data = await response.json() as {
    results?: Array<{
      type?: string
      error?: string | { message?: string }
      response?: { result?: { cols?: Array<{ name: string }>; rows?: Array<Array<{ value?: unknown }>> } }
    }>
  }
  const first = data.results?.[0]
  if (first?.type === 'error' || first?.error) {
    const error = first.error
    throw new Error(typeof error === 'string' ? error : error?.message || 'Database query failed')
  }

  const result = first?.response?.result
  if (!result) throw new Error('Database returned no result')
  const columns = result.cols || []
  return (result.rows || []).map((row) =>
    Object.fromEntries(columns.map((column, index) => [column.name, row[index]?.value ?? null]))
  )
}
