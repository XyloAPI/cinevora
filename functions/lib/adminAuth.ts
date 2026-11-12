async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function isAdminRequest(request: Request, env: Record<string, string | undefined>): Promise<boolean> {
  const authorization = request.headers.get('Authorization')
  const password = env.ADMIN_PASSWORD || env.VITE_ADMIN_PASSWORD
  if (!authorization?.startsWith('Bearer ') || !password) return false
  return authorization.slice(7) === await sha256(password)
}
