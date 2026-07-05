const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const OPENL_HOST = 'openl-translate.p.rapidapi.com'

async function translateOpenL(text: string): Promise<string | null> {
  if (!API_KEY) return null
  const res = await fetch(`https://${OPENL_HOST}/translate/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': OPENL_HOST,
      'x-rapidapi-key': API_KEY,
    },
    body: JSON.stringify({ target_lang: 'id', text: [text] }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.translatedTexts?.[0] || data.translated_text?.[0] || data.translated_text || null
}

async function translateMyMemory(text: string): Promise<string | null> {
  try {
    const q = text.length > 500 ? text.slice(0, 497) + '...' : text
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|id`)
    if (!res.ok) return null
    const data = await res.json()
    return data.responseData?.translatedText || null
  } catch {
    return null
  }
}

export async function translateToId(text: string): Promise<string> {
  const t = await translateOpenL(text) || await translateMyMemory(text)
  if (!t) throw new Error('Translate API unavailable (502)')
  return t
}
