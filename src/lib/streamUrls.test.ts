import { describe, it, expect } from 'vitest'
import {
  normalizeDirectUrl,
  parseEpisodesTree,
  resolveEpisodeSource,
  resolveActiveSource,
  sanitizeFilename,
} from '@/lib/streamUrls'

const SERIES_TREE = JSON.stringify([
  {
    season: 1,
    episodes: [
      { episode: 1, url: 'https://cdn/s1e1.mp4', url2: 'https://cdn/s1e1-mirror.mp4' },
      { episode: 2, url: 'https://cdn/s1e2.mp4', url2: 'https://cdn/s1e2-mirror.mp4' },
    ],
  },
  {
    season: 2,
    episodes: [{ episode: 1, url: 'https://cdn/s2e1.mp4' }],
  },
])

describe('normalizeDirectUrl', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeDirectUrl('')).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeDirectUrl('  https://cdn.x.com/a.mp4  ')).toBe('https://cdn.x.com/a.mp4')
  })

  it('prepends https when scheme is missing', () => {
    expect(normalizeDirectUrl('cdn.x.com/a.mp4')).toBe('https://cdn.x.com/a.mp4')
  })

  it('keeps http scheme untouched', () => {
    expect(normalizeDirectUrl('http://cdn.x.com/a.mp4')).toBe('http://cdn.x.com/a.mp4')
  })

  it('resolves protocol-relative url to https', () => {
    expect(normalizeDirectUrl('//cdn.x.com/a.mp4')).toBe('https://cdn.x.com/a.mp4')
  })

  it('keeps non-http schemes untouched', () => {
    expect(normalizeDirectUrl('data:text/plain,x')).toBe('data:text/plain,x')
  })
})

describe('parseEpisodesTree', () => {
  it('returns empty array for null', () => {
    expect(parseEpisodesTree(null)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseEpisodesTree('')).toEqual([])
  })

  it('returns empty array for malformed json', () => {
    expect(parseEpisodesTree('not json')).toEqual([])
  })

  it('returns empty array when json is not an array', () => {
    expect(parseEpisodesTree('{"a":1}')).toEqual([])
  })

  it('parses a valid season tree', () => {
    const tree = parseEpisodesTree(SERIES_TREE)
    expect(tree).toHaveLength(2)
    expect(tree[0].season).toBe(1)
    expect(tree[0].episodes).toHaveLength(2)
    expect(tree[0].episodes[0].url).toBe('https://cdn/s1e1.mp4')
  })
})

describe('resolveEpisodeSource', () => {
  it('returns the plain url for a movie on slot 1', () => {
    const url = resolveEpisodeSource({
      streamUrl: 'https://cdn/a.mp4',
      streamUrl2: null,
      season: 0,
      episode: 0,
      slot: 1,
    })
    expect(url).toBe('https://cdn/a.mp4')
  })

  it('returns the second url for a movie on slot 2', () => {
    const url = resolveEpisodeSource({
      streamUrl: 'https://cdn/a.mp4',
      streamUrl2: 'https://cdn/b.mp4',
      season: 0,
      episode: 0,
      slot: 2,
    })
    expect(url).toBe('https://cdn/b.mp4')
  })

  it('returns null when slot 2 is empty for a movie', () => {
    const url = resolveEpisodeSource({
      streamUrl: 'https://cdn/a.mp4',
      streamUrl2: null,
      season: 0,
      episode: 0,
      slot: 2,
    })
    expect(url).toBeNull()
  })

  it('returns null when the movie url is empty', () => {
    const url = resolveEpisodeSource({
      streamUrl: '',
      streamUrl2: 'https://cdn/b.mp4',
      season: 0,
      episode: 0,
      slot: 1,
    })
    expect(url).toBeNull()
  })

  it('resolves the requested episode of a series on slot 1', () => {
    const url = resolveEpisodeSource({
      streamUrl: SERIES_TREE,
      streamUrl2: null,
      season: 1,
      episode: 2,
      slot: 1,
    })
    expect(url).toBe('https://cdn/s1e2.mp4')
  })

  it('resolves the mirror url of the requested episode on slot 2', () => {
    const url = resolveEpisodeSource({
      streamUrl: SERIES_TREE,
      streamUrl2: null,
      season: 1,
      episode: 2,
      slot: 2,
    })
    expect(url).toBe('https://cdn/s1e2-mirror.mp4')
  })

  it('returns null when the requested season and episode do not exist', () => {
    const url = resolveEpisodeSource({
      streamUrl: SERIES_TREE,
      streamUrl2: null,
      season: 3,
      episode: 7,
      slot: 1,
    })
    expect(url).toBeNull()
  })

  it('ignores season and episode for a plain movie url', () => {
    const url = resolveEpisodeSource({
      streamUrl: 'https://cdn/a.mp4',
      streamUrl2: null,
      season: 3,
      episode: 7,
      slot: 1,
    })
    expect(url).toBe('https://cdn/a.mp4')
  })

  it('returns null when the episode has no mirror url on slot 2', () => {
    const url = resolveEpisodeSource({
      streamUrl: SERIES_TREE,
      streamUrl2: null,
      season: 2,
      episode: 1,
      slot: 2,
    })
    expect(url).toBeNull()
  })
})

describe('resolveActiveSource', () => {
  it('returns primary when mirror is not preferred', () => {
    expect(resolveActiveSource({ primary: 'a', mirror: null, preferMirror: false })).toBe('a')
  })

  it('falls back to primary when the preferred mirror is missing', () => {
    expect(resolveActiveSource({ primary: 'a', mirror: null, preferMirror: true })).toBe('a')
  })

  it('returns the mirror when it is preferred and available', () => {
    expect(resolveActiveSource({ primary: 'a', mirror: 'b', preferMirror: true })).toBe('b')
  })

  it('returns the mirror when primary is missing', () => {
    expect(resolveActiveSource({ primary: null, mirror: 'b', preferMirror: true })).toBe('b')
  })

  it('returns null when neither source exists', () => {
    expect(resolveActiveSource({ primary: null, mirror: null, preferMirror: false })).toBeNull()
  })

  it('treats empty strings as missing', () => {
    expect(resolveActiveSource({ primary: '', mirror: '', preferMirror: true })).toBeNull()
  })
})

describe('sanitizeFilename', () => {
  it('removes characters that are illegal in filenames', () => {
    expect(sanitizeFilename('Dune: Part Two')).toBe('Dune Part Two')
  })

  it('removes path separators', () => {
    const result = sanitizeFilename('a/b\\c')
    expect(result).not.toContain('/')
    expect(result).not.toContain('\\')
  })

  it('never returns an empty string for a non-empty input', () => {
    expect(sanitizeFilename('///').length).toBeGreaterThan(0)
  })
})
