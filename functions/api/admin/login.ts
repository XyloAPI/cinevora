async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
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
    const { username, password } = await request.json()

    const adminUser = env.ADMIN_USERNAME || env.VITE_ADMIN_USERNAME
    const adminPass = env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD

    if (!adminUser || !adminPass) {
      return new Response(JSON.stringify({ error: 'Admin credentials not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (username === adminUser && password === adminPass) {
      const token = await sha256(adminPass)
      return new Response(JSON.stringify({ success: true, token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Authentication error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
