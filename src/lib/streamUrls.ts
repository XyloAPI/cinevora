export interface EpisodeEntry {
  episode: number
  url: string
  url2?: string
  sub?: string
}

export interface SeasonEntry {
  season: number
  episodes: EpisodeEntry[]
}

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g

export function normalizeDirectUrl(input: string): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (SCHEME_PATTERN.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function parseEpisodesTree(raw: string | null | undefined): SeasonEntry[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed.startsWith('[')) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const seasons: SeasonEntry[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const season = (entry as { season?: unknown }).season
    const episodes = (entry as { episodes?: unknown }).episodes
    if (typeof season !== 'number' || !Array.isArray(episodes)) continue

    const parsedEpisodes: EpisodeEntry[] = []
    for (const ep of episodes) {
      if (!ep || typeof ep !== 'object') continue
      const episode = (ep as { episode?: unknown }).episode
      if (typeof episode !== 'number') continue
      const url = (ep as { url?: unknown }).url
      const url2 = (ep as { url2?: unknown }).url2
      const sub = (ep as { sub?: unknown }).sub
      parsedEpisodes.push({
        episode,
        url: typeof url === 'string' ? url : '',
        url2: typeof url2 === 'string' ? url2 : undefined,
        sub: typeof sub === 'string' ? sub : undefined,
      })
    }
    seasons.push({ season, episodes: parsedEpisodes })
  }
  return seasons
}

export function resolveEpisodeSource(params: {
  streamUrl?: string | null
  streamUrl2?: string | null
  season: number
  episode: number
  slot: 1 | 2
}): string | null {
  const { streamUrl, streamUrl2, season, episode, slot } = params
  const primary = (streamUrl ?? '').trim()

  if (primary.startsWith('[')) {
    const seasons = parseEpisodesTree(primary)
    const seasonEntry = seasons.find((s) => s.season === season)
    if (!seasonEntry) return null
    const episodeEntry = seasonEntry.episodes.find((e) => e.episode === episode)
    if (!episodeEntry) return null
    const value = slot === 1 ? episodeEntry.url : episodeEntry.url2
    const trimmed = (value ?? '').trim()
    return trimmed ? trimmed : null
  }

  const value = slot === 1 ? primary : (streamUrl2 ?? '').trim()
  return value ? value : null
}

export function resolveActiveSource(params: {
  primary: string | null
  mirror: string | null
  preferMirror: boolean
}): string | null {
  const primary = (params.primary ?? '').trim()
  const mirror = (params.mirror ?? '').trim()
  if (params.preferMirror) return mirror || primary || null
  return primary || mirror || null
}

export function sanitizeFilename(name: string): string {
  const cleaned = (name ?? '')
    .replace(ILLEGAL_FILENAME_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
    .trim()
  return cleaned || 'video'
}
