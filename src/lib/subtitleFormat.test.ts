import { describe, it, expect } from 'vitest'
import { ensureVtt, isVtt, srtToVtt, stripAssTags } from '@/lib/subtitleFormat'

const SRT = `1
00:00:01,000 --> 00:00:04,000
Halo dunia

2
00:00:05,500 --> 00:00:07,250
Baris kedua
`

describe('stripAssTags', () => {
  it('removes alignment and style overrides', () => {
    expect(stripAssTags('{\\an8}Halo {\\i1}dunia{\\i0}')).toBe('Halo dunia')
  })

  it('keeps plain braces that are not ASS overrides', () => {
    expect(stripAssTags('{catatan}')).toBe('{catatan}')
  })
})

describe('isVtt', () => {
  it('detects a WEBVTT header', () => {
    expect(isVtt('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHalo')).toBe(true)
  })

  it('detects a WEBVTT header after a BOM and whitespace', () => {
    expect(isVtt('\uFEFF  WEBVTT\n')).toBe(true)
  })

  it('rejects SRT content', () => {
    expect(isVtt(SRT)).toBe(false)
  })
})

describe('srtToVtt', () => {
  it('adds the WEBVTT header', () => {
    expect(srtToVtt(SRT).startsWith('WEBVTT\n\n')).toBe(true)
  })

  it('drops cue sequence numbers', () => {
    const vtt = srtToVtt(SRT)
    expect(vtt).not.toMatch(/^\s*1\s*$/m)
    expect(vtt).not.toMatch(/^\s*2\s*$/m)
  })

  it('replaces commas in timestamps with dots', () => {
    expect(srtToVtt(SRT)).toContain('00:00:01.000 --> 00:00:04.000')
    expect(srtToVtt(SRT)).not.toContain('00:00:01,000')
  })

  it('normalizes CRLF line endings', () => {
    const vtt = srtToVtt(SRT.replace(/\n/g, '\r\n'))
    expect(vtt).not.toContain('\r')
    expect(vtt).toContain('00:00:05.500 --> 00:00:07.250')
  })

  it('keeps numeric cue text that is not a sequence number', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n12345\n')
    expect(vtt).toContain('\n12345')
  })

  it('strips ASS tags from cue text', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n{\\an8}Hubungi saya kembali.\n')
    expect(vtt).not.toContain('{\\an8}')
    expect(vtt).toContain('\nHubungi saya kembali.')
  })

  it('moves top-aligned cues to the top of the frame', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n{\\an8}Halo\n')
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.000 line:10%')
  })

  it('moves middle-aligned cues to the middle of the frame', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n{\\an5}Halo\n')
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.000 line:50%')
  })

  it('leaves bottom-aligned cues without a line setting', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n{\\an2}Halo\n')
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.000\nHalo')
  })

  it('strips inline style tags without adding a line setting', () => {
    const vtt = srtToVtt('1\n00:00:01,000 --> 00:00:02,000\n{\\i1}Halo{\\i0}\n')
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.000\nHalo')
  })
})

describe('ensureVtt', () => {
  it('leaves VTT content untouched', () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHalo'
    expect(ensureVtt(vtt)).toBe(vtt)
  })

  it('strips the BOM from VTT content', () => {
    expect(ensureVtt('\uFEFFWEBVTT\n')).toBe('WEBVTT\n')
  })

  it('strips ASS tags from VTT content', () => {
    expect(ensureVtt('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n{\\an8}Halo')).toContain('\nHalo')
  })

  it('converts SRT content', () => {
    const vtt = ensureVtt(SRT)
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true)
    expect(vtt).toContain('00:00:01.000 --> 00:00:04.000')
  })

  it('adds the header to headerless cue content', () => {
    const vtt = ensureVtt('00:00:01.000 --> 00:00:02.000\nHalo')
    expect(vtt).toBe('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHalo')
  })
})
