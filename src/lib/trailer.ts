export type TrailerSource =
  | { type: 'youtube'; embedUrl: string }
  | { type: 'file'; url: string }

const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/'
const YOUTUBE_EMBED_PARAMS =
  '?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1'

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.m4v', '.mov', '.ogv', '.mkv']

function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/').filter(Boolean)[1] || null
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/').filter(Boolean)[1] || null
      }
      const v = parsed.searchParams.get('v')
      if (v) return v
    }
  } catch {
    return null
  }

  return null
}

export function isDirectVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (extractYoutubeId(trimmed)) return false

  const path = trimmed.split(/[?#]/)[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))
}

export function getTrailerSource(url: string | null | undefined): TrailerSource | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  const youtubeId = extractYoutubeId(trimmed)
  if (youtubeId) {
    return { type: 'youtube', embedUrl: `${YOUTUBE_EMBED_BASE}${youtubeId}${YOUTUBE_EMBED_PARAMS}` }
  }

  if (isDirectVideoUrl(trimmed)) {
    return { type: 'file', url: trimmed }
  }

  return null
}
