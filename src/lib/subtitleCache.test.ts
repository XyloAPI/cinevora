import { describe, it, expect } from 'vitest'
import { computeSubtitleEtag, etagMatches, hashString } from '@/lib/subtitleCache'

describe('hashString', () => {
  it('is stable for the same input', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
  })

  it('differs for different input', () => {
    expect(hashString('abc')).not.toBe(hashString('abd'))
  })

  it('returns a hex string', () => {
    expect(hashString('abc')).toMatch(/^[0-9a-f]+$/)
  })
})

describe('computeSubtitleEtag', () => {
  it('ignores the upstream etag because the body is transformed', () => {
    expect(computeSubtitleEtag({ upstreamEtag: 'abc123', content: 'WEBVTT' })).toBe(
      computeSubtitleEtag({ content: 'WEBVTT' })
    )
  })

  it('derives the etag from the content', () => {
    const etag = computeSubtitleEtag({ content: 'WEBVTT\nhalo' })
    expect(etag.startsWith('"')).toBe(true)
    expect(etag.endsWith('"')).toBe(true)
  })

  it('produces the same etag for the same content', () => {
    expect(computeSubtitleEtag({ content: 'WEBVTT\nhalo' })).toBe(
      computeSubtitleEtag({ content: 'WEBVTT\nhalo' })
    )
  })

  it('produces a different etag for different content', () => {
    expect(computeSubtitleEtag({ content: 'WEBVTT\nhalo' })).not.toBe(
      computeSubtitleEtag({ content: 'WEBVTT\nhalo 2' })
    )
  })

  it('falls back to the content when the upstream etag is empty', () => {
    const etag = computeSubtitleEtag({ upstreamEtag: '', content: 'WEBVTT\nhalo' })
    expect(etag).toBe(computeSubtitleEtag({ content: 'WEBVTT\nhalo' }))
  })
})

describe('etagMatches', () => {
  const etag = '"v1"'

  it('returns false when the client sent no validator', () => {
    expect(etagMatches(null, etag)).toBe(false)
  })

  it('matches the wildcard', () => {
    expect(etagMatches('*', etag)).toBe(true)
  })

  it('matches an identical etag', () => {
    expect(etagMatches('"v1"', etag)).toBe(true)
  })

  it('matches a weak validator against a strong etag', () => {
    expect(etagMatches('W/"v1"', etag)).toBe(true)
  })

  it('matches an etag inside a list', () => {
    expect(etagMatches('"v0", "v1"', etag)).toBe(true)
  })

  it('does not match a different etag', () => {
    expect(etagMatches('"v2"', etag)).toBe(false)
  })
})
