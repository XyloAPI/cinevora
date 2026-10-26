const MEDIA_EXTENSIONS = [
  '.mp4',
  '.m3u8',
  '.webm',
  '.mkv',
  '.mov',
  '.m4v',
  '.ogv',
  '.avi',
  '.ts',
]

const EMBED_MARKERS = ['/embed', '/player', 'embed=']

export function isEmbedUrl(url: string | null | undefined): boolean {
  const trimmed = (url ?? '').trim()
  if (!/^https?:\/\//i.test(trimmed)) return false

  const [path, query = ''] = trimmed.split(/[?#]/)
  const lowerPath = path.toLowerCase()
  const lowerQuery = query.toLowerCase()

  if (EMBED_MARKERS.some((marker) => lowerPath.includes(marker) || lowerQuery.includes(marker))) {
    return true
  }

  return !MEDIA_EXTENSIONS.some((extension) => lowerPath.endsWith(extension))
}
