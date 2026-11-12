export async function translateToId(text: string): Promise<string> {
  if (!text || !text.trim()) return ''

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = sessionStorage.getItem('admin_token')
  if (!token) throw new Error('Admin session expired. Please sign in again.')

  const response = await fetch(`${apiBase}/translate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || `Translation failed: ${response.status}`)
  }
  if (typeof data?.translatedText !== 'string') {
    throw new Error('Invalid translation response')
  }
  return data.translatedText
}
