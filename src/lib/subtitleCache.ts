export function hashString(content: string): string {
  let fnv = 0x811c9dc5
  let djb2 = 5381
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i)
    fnv ^= code
    fnv = Math.imul(fnv, 0x01000193) >>> 0
    djb2 = ((djb2 << 5) + djb2 + code) >>> 0
  }
  return `${fnv.toString(16).padStart(8, '0')}${djb2.toString(16).padStart(8, '0')}${content.length.toString(16)}`
}

export function computeSubtitleEtag(opts: {
  upstreamEtag?: string | null
  content: string
}): string {
  const upstream = (opts.upstreamEtag ?? '').trim()
  if (upstream) {
    const normalized = upstream.replace(/^W\//i, '')
    return normalized.startsWith('"') ? normalized : `"${normalized}"`
  }
  return `"${hashString(opts.content)}"`
}

export function etagMatches(ifNoneMatch: string | null | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false
  const trimmed = ifNoneMatch.trim()
  if (trimmed === '*') return true

  const normalize = (value: string) => value.trim().replace(/^W\//i, '')
  const target = normalize(etag)

  return trimmed
    .split(',')
    .map((part) => normalize(part))
    .some((part) => part === target)
}
