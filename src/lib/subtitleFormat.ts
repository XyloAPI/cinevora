const BOM_PATTERN = /^\uFEFF/
const VTT_HEADER = /^[\s\uFEFF]*WEBVTT(?:[ \t\r\n]|$)/i
const SRT_TIMESTAMP = /(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g
const ASS_TAG = /\{\\[^}]*\}/g
const ASS_ALIGN = /\{\\an([1-9])\}/i

function lineSetting(align: string): string {
  const position = Number(align)
  if (position >= 7) return ' line:10%'
  if (position >= 4) return ' line:50%'
  return ''
}

function convertBlock(block: string): string {
  const lines = block.split('\n')
  const start = /^\s*\d+\s*$/.test(lines[0] ?? '') && (lines[1] ?? '').includes('-->') ? 1 : 0
  const timing = lines[start] ?? ''

  if (!timing.includes('-->')) {
    return lines.map((line) => line.replace(ASS_TAG, '')).join('\n')
  }

  const body = lines.slice(start + 1)
  const align = body.join('\n').match(ASS_ALIGN)?.[1]
  const text = body.map((line) => line.replace(ASS_TAG, '')).join('\n')
  const settings = align ? lineSetting(align) : ''

  return `${timing.replace(SRT_TIMESTAMP, '$1.$2')}${settings}\n${text}`
}

export function stripAssTags(content: string): string {
  return content.replace(ASS_TAG, '')
}

export function isVtt(content: string): boolean {
  return VTT_HEADER.test(content)
}

export function srtToVtt(content: string): string {
  const blocks = content
    .replace(BOM_PATTERN, '')
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return `WEBVTT\n\n${blocks.map(convertBlock).join('\n\n')}`
}

export function ensureVtt(content: string): string {
  if (isVtt(content)) return stripAssTags(content.replace(BOM_PATTERN, ''))
  return srtToVtt(content)
}
