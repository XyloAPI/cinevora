import { describe, it, expect } from 'vitest'
import { buildDownloadUrl, buildSubtitleProxyUrl } from '@/lib/streamEndpoints'

describe('buildDownloadUrl', () => {
  it('points at the download proxy', () => {
    const url = buildDownloadUrl({ movieId: 'm1', slot: 1, season: 0, episode: 0 })
    expect(url.startsWith('/api/stream/download?')).toBe(true)
  })

  it('carries every parameter', () => {
    const url = new URL(buildDownloadUrl({ movieId: 'm1', slot: 2, season: 3, episode: 4 }), 'http://x')
    expect(url.searchParams.get('movieId')).toBe('m1')
    expect(url.searchParams.get('slot')).toBe('2')
    expect(url.searchParams.get('season')).toBe('3')
    expect(url.searchParams.get('episode')).toBe('4')
  })

  it('defaults season and episode to zero', () => {
    const url = new URL(buildDownloadUrl({ movieId: 'm1', slot: 1 }), 'http://x')
    expect(url.searchParams.get('season')).toBe('0')
    expect(url.searchParams.get('episode')).toBe('0')
  })
})

describe('buildSubtitleProxyUrl', () => {
  it('points at the subtitle proxy', () => {
    const url = buildSubtitleProxyUrl({ movieId: 'm1', season: 2, episode: 5 })
    expect(url.startsWith('/api/subtitle?')).toBe(true)
  })

  it('carries every parameter', () => {
    const url = new URL(buildSubtitleProxyUrl({ movieId: 'm1', season: 2, episode: 5 }), 'http://x')
    expect(url.searchParams.get('movieId')).toBe('m1')
    expect(url.searchParams.get('season')).toBe('2')
    expect(url.searchParams.get('episode')).toBe('5')
  })

  it('url-encodes a movie id with special characters', () => {
    const url = buildSubtitleProxyUrl({ movieId: 'a b&c=d', season: 0, episode: 0 })
    expect(url).not.toContain('a b&c=d')
    expect(new URL(url, 'http://x').searchParams.get('movieId')).toBe('a b&c=d')
  })

  it('adds a version parameter so a changed subtitle url is never cached', () => {
    const url = new URL(
      buildSubtitleProxyUrl({ movieId: 'm1', season: 0, episode: 0, version: 'https://cdn/a.vtt' }),
      'http://x'
    )
    expect(url.searchParams.get('v')).toBeTruthy()
  })

  it('produces a different version parameter for a different subtitle url', () => {
    const a = new URL(
      buildSubtitleProxyUrl({ movieId: 'm1', season: 0, episode: 0, version: 'https://cdn/a.vtt' }),
      'http://x'
    ).searchParams.get('v')
    const b = new URL(
      buildSubtitleProxyUrl({ movieId: 'm1', season: 0, episode: 0, version: 'https://cdn/b.vtt' }),
      'http://x'
    ).searchParams.get('v')
    expect(a).not.toBe(b)
  })

  it('omits the version parameter when none is given', () => {
    const url = new URL(buildSubtitleProxyUrl({ movieId: 'm1', season: 0, episode: 0 }), 'http://x')
    expect(url.searchParams.get('v')).toBeNull()
  })
})
