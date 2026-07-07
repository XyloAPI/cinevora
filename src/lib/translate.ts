const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const OPENL_HOST = 'openl-translate.p.rapidapi.com'

// Layer 1: OpenL Translate (Paid / RapidAPI)
async function translateOpenL(text: string): Promise<string | null> {
  if (!API_KEY) return null
  try {
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
  } catch {
    return null
  }
}

// Layer 2: Google Translate Client (Free/Keyless API) - Very stable & fast
async function translateGoogleFree(text: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data?.[0])) {
      return data[0].map((x: any) => x?.[0]).filter(Boolean).join('')
    }
    return null
  } catch {
    return null
  }
}

// Layer 3: MyMemory Translate (Free/Keyless) - Sliced for safety
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

// Layer 4: Lingva Translate (Free/Keyless mirror)
async function translateLingva(text: string): Promise<string | null> {
  try {
    const url = `https://lingva.ml/api/v1/auto/id/${encodeURIComponent(text)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.translation || null
  } catch {
    return null
  }
}

// Layer 5: LibreTranslate (Free public instance)
async function translateLibreTranslate(text: string): Promise<string | null> {
  try {
    const res = await fetch('https://translate.terraprint.co/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: 'id', format: 'text' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.translatedText || null
  } catch {
    return null
  }
}

// Layered Fallback Orchestration
export async function translateToId(text: string): Promise<string> {
  if (!text || !text.trim()) return ''

  // Run fallbacks sequentially
  const t = 
    await translateOpenL(text) || 
    await translateGoogleFree(text) || 
    await translateMyMemory(text) || 
    await translateLingva(text) || 
    await translateLibreTranslate(text)

  if (!t) {
    throw new Error('All translation engines failed. Please translate manually.')
  }
  return t
}
