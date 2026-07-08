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
    
    // 1. Handle Pixeldrain links (including mirrors/subdomains containing pixeldrain)
    if (url.hostname.includes('pixeldrain')) {
      const segments = url.pathname.split('/').filter(Boolean)
      
      // If it's already /api/file/{id}
      if (url.pathname.includes('/api/file/')) {
        return streamUrl
      }
      
      // If it's /u/{id}
      const uIndex = segments.findIndex((s) => s === 'u')
      if (uIndex !== -1 && segments[uIndex + 1]) {
        return `${url.origin}/api/file/${segments[uIndex + 1]}`
      }
      
      // Fallback: if last segment is a 8-character alphanumeric string (common for pixeldrain IDs)
      const lastSegment = segments[segments.length - 1]
      if (lastSegment && /^[a-zA-Z0-9]{8}$/.test(lastSegment)) {
        return `${url.origin}/api/file/${lastSegment}`
      }
    }

    // 2. Handle StreamXyloSpace / standard /e/ stream links
    const segments = url.pathname.split('/').filter(Boolean)
    const eIndex = segments.findIndex((s) => s === 'e')
    const streamId = eIndex !== -1 && segments[eIndex + 1] ? segments[eIndex + 1] : null
    
    if (streamId) {
      return `${url.origin}/download/${streamId}`
    }

    // 3. Fallback for direct media links
    if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.mkv')) {
      return streamUrl
    }
    
    return null
  } catch {
    return null
  }
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
