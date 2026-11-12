import { isAdminRequest } from '../../lib/adminAuth'
import { tursoQuery } from '../../lib/turso'

type TranslationProvider = 'gtx' | 'deepl'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function ensureSettingsTable(env: Record<string, string | undefined>) {
  await tursoQuery(
    env,
    'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
  )
}

async function readSettings(env: Record<string, string | undefined>) {
  await ensureSettingsTable(env)
  const rows = await tursoQuery(env, "SELECT key, value FROM app_settings WHERE key IN ('translation_provider', 'deepl_api_key')")
  return new Map(rows.map((row) => [String(row.key), String(row.value)]))
}

async function requireAdmin(request: Request, env: Record<string, string | undefined>) {
  return isAdminRequest(request, env)
}

export async function onRequestGet({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  if (!(await requireAdmin(request, env))) return jsonResponse({ error: 'Unauthorized' }, 401)

  try {
    const settings = await readSettings(env)
    const provider = settings.get('translation_provider')
    return jsonResponse({
      provider: provider === 'deepl' ? 'deepl' : 'gtx',
      hasDeepLKey: Boolean(settings.get('deepl_api_key')),
      deeplApiKey: settings.get('deepl_api_key') || '',
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to load settings' }, 500)
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  if (!(await requireAdmin(request, env))) return jsonResponse({ error: 'Unauthorized' }, 401)

  try {
    const body = await request.json() as {
      provider?: TranslationProvider
      deeplApiKey?: string
      clearDeepLKey?: boolean
    }
    if (body.provider !== 'gtx' && body.provider !== 'deepl') {
      return jsonResponse({ error: 'Unsupported translation provider' }, 400)
    }
    if (body.deeplApiKey !== undefined && typeof body.deeplApiKey !== 'string') {
      return jsonResponse({ error: 'Invalid DeepL API key' }, 400)
    }
    const apiKey = body.deeplApiKey?.trim()
    if (apiKey && apiKey.length > 500) {
      return jsonResponse({ error: 'DeepL API key is too long' }, 400)
    }

    const currentSettings = await readSettings(env)
    if (
      body.provider === 'deepl' &&
      !apiKey &&
      (body.clearDeepLKey || !currentSettings.get('deepl_api_key'))
    ) {
      return jsonResponse({ error: 'Enter a DeepL API key before selecting DeepL' }, 400)
    }
    await tursoQuery(
      env,
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['translation_provider', body.provider]
    )

    if (apiKey) {
      await tursoQuery(
        env,
        'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['deepl_api_key', apiKey]
      )
    } else if (body.clearDeepLKey) {
      await tursoQuery(env, 'DELETE FROM app_settings WHERE key = ?', ['deepl_api_key'])
    }

    const settings = await readSettings(env)
    return jsonResponse({
      provider: body.provider,
      hasDeepLKey: Boolean(settings.get('deepl_api_key')),
      deeplApiKey: settings.get('deepl_api_key') || '',
    })
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to save settings' }, 500)
  }
}
