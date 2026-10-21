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

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const cleanUrl = url.trim()
    if (cleanUrl.includes('youtube.com/embed/')) {
      const match = cleanUrl.match(/embed\/([^/?#]+)/)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1`
      }
    }
    const u = new URL(cleanUrl)
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let v = u.searchParams.get('v')
      if (!v) {
        if (u.hostname.includes('youtu.be')) {
          v = u.pathname.slice(1).split('/')[0]
        } else if (u.pathname.startsWith('/v/')) {
          v = u.pathname.slice(3).split('/')[0]
        } else if (u.pathname.startsWith('/embed/')) {
          v = u.pathname.slice(7).split('/')[0]
        }
      }
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&controls=0&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1`
    }
    return null
  } catch {
    return null
  }
}
