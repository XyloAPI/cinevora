import { isAdminRequest } from '../lib/adminAuth'
import { tursoQuery } from '../lib/turso'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getTranslationSettings(env: Record<string, string | undefined>) {
  await tursoQuery(
    env,
    'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  )
  const rows = await tursoQuery(
    env,
    "SELECT key, value FROM app_settings WHERE key IN ('translation_provider', 'deepl_api_key')"
  )
  return new Map(rows.map((row) => [String(row.key), String(row.value)]))
}

async function translateWithGtx(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Google Translate returned ${response.status}`)
  const data = await response.json() as [Array<[string]>]
  const translated = Array.isArray(data?.[0]) ? data[0].map((part) => part?.[0]).filter(Boolean).join('') : ''
  if (!translated) throw new Error('Google Translate returned no translation')
  return translated
}

async function translateWithDeepL(text: string, apiKey: string): Promise<string> {
  const endpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'
  const body = new URLSearchParams({ text, target_lang: 'ID' })
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('DeepL rejected the API key or account access (403). Verify the key and account type.')
    }
    throw new Error(`DeepL returned ${response.status}`)
  }
  const data = await response.json() as { translations?: Array<{ text?: string }> }
  const translated = data.translations?.[0]?.text
  if (!translated) throw new Error('DeepL returned no translation')
  return translated
}

export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  if (!(await isAdminRequest(request, env))) return jsonResponse({ error: 'Unauthorized' }, 401)

  try {
    const body = await request.json() as { text?: unknown }
    const text = body.text
    if (typeof text !== 'string') return jsonResponse({ error: 'Text is required' }, 400)
    if (text.length > 5_000) return jsonResponse({ error: 'Text is too long to translate' }, 413)
    if (!text.trim()) return jsonResponse({ translatedText: '' })

    const settings = await getTranslationSettings(env)
    const provider = settings.get('translation_provider') || 'gtx'
    let translatedText: string
    if (provider === 'deepl') {
      const apiKey = settings.get('deepl_api_key')
      if (!apiKey) throw new Error('DeepL API key is not configured in Admin Settings')
      translatedText = await translateWithDeepL(text, apiKey)
    } else {
      translatedText = await translateWithGtx(text)
    }
    return jsonResponse({ translatedText })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Translation failed' }, 502)
  }
}
