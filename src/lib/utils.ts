import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getDownloadUrl(streamUrl: string | null | undefined): string | null {
  if (!streamUrl) return null
  try {
    const url = new URL(streamUrl)
    const segments = url.pathname.split('/').filter(Boolean)
    const eIndex = segments.findIndex((s) => s === 'e')
    const streamId = eIndex !== -1 && segments[eIndex + 1] ? segments[eIndex + 1] : null
    if (!streamId) return null
    return `${url.origin}/download/${streamId}`
  } catch {
    return null
  }
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const v = u.searchParams.get('v') || u.pathname.slice(1).split('/')[0]
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1`
    }
    return null
  } catch {
    return null
  }
}
