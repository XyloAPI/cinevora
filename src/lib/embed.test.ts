import { describe, it, expect } from 'vitest'
import { isEmbedUrl } from '@/lib/embed'

describe('isEmbedUrl', () => {
  it('detects an embed page url', () => {
    expect(isEmbedUrl('https://player.example.com/embed/abc.html')).toBe(true)
  })

  it('detects an embed query marker', () => {
    expect(isEmbedUrl('https://example.com/watch?embed=1')).toBe(true)
  })

  it('detects a url without a media extension', () => {
    expect(isEmbedUrl('https://example.com/stream/abc')).toBe(true)
  })

  it('treats direct media files as not embed', () => {
    expect(isEmbedUrl('https://example.com/movie.mp4')).toBe(false)
  })

  it('treats m3u8 playlists as not embed', () => {
    expect(isEmbedUrl('https://example.com/master.m3u8')).toBe(false)
  })

  it('ignores query strings on media files', () => {
    expect(isEmbedUrl('https://example.com/movie.mp4?token=abc')).toBe(false)
  })

  it('rejects empty and non-http urls', () => {
    expect(isEmbedUrl('')).toBe(false)
    expect(isEmbedUrl(null)).toBe(false)
    expect(isEmbedUrl('/watch/abc')).toBe(false)
  })
})
