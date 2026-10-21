import { describe, it, expect } from 'vitest'
import { getTrailerSource, isDirectVideoUrl } from '@/lib/trailer'

describe('getTrailerSource', () => {
  it('detects a youtube watch url', () => {
    const source = getTrailerSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(source?.type).toBe('youtube')
    expect(source?.type === 'youtube' && source.embedUrl).toContain(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('detects a short youtube url', () => {
    const source = getTrailerSource('https://youtu.be/dQw4w9WgXcQ')
    expect(source?.type).toBe('youtube')
    expect(source?.type === 'youtube' && source.embedUrl).toContain(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('detects a youtube embed url', () => {
    const source = getTrailerSource('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(source?.type).toBe('youtube')
  })

  it('detects a youtube shorts url', () => {
    expect(getTrailerSource('https://www.youtube.com/shorts/dQw4w9WgXcQ')?.type).toBe('youtube')
  })

  it('detects a direct mp4 file on a cdn', () => {
    const source = getTrailerSource('https://cdn.example.com/trailers/teaser.mp4')
    expect(source).toEqual({ type: 'file', url: 'https://cdn.example.com/trailers/teaser.mp4' })
  })

  it('detects a direct webm file', () => {
    expect(getTrailerSource('https://cdn.example.com/trailer.webm')?.type).toBe('file')
  })

  it('ignores the query string when detecting the extension', () => {
    const source = getTrailerSource('https://cdn.example.com/trailer.mp4?token=abc123')
    expect(source).toEqual({ type: 'file', url: 'https://cdn.example.com/trailer.mp4?token=abc123' })
  })

  it('detects a file url inside a bucket path', () => {
    const source = getTrailerSource(
      'https://huggingface.co/buckets/user/cdn1/resolve/1aa00f1e-ef2a.mkv'
    )
    expect(source?.type).toBe('file')
  })

  it('returns null for an empty url', () => {
    expect(getTrailerSource('')).toBeNull()
    expect(getTrailerSource(null)).toBeNull()
    expect(getTrailerSource(undefined)).toBeNull()
  })

  it('returns null for an unsupported url', () => {
    expect(getTrailerSource('https://vimeo.com/12345')).toBeNull()
    expect(getTrailerSource('https://example.com/page')).toBeNull()
  })
})

describe('isDirectVideoUrl', () => {
  it('accepts browser-playable video extensions', () => {
    expect(isDirectVideoUrl('https://x/a.mp4')).toBe(true)
    expect(isDirectVideoUrl('https://x/a.webm')).toBe(true)
    expect(isDirectVideoUrl('https://x/a.m4v')).toBe(true)
    expect(isDirectVideoUrl('https://x/a.mov')).toBe(true)
  })

  it('rejects youtube urls', () => {
    expect(isDirectVideoUrl('https://www.youtube.com/watch?v=abc')).toBe(false)
  })

  it('rejects non-video urls', () => {
    expect(isDirectVideoUrl('https://example.com')).toBe(false)
  })
})
