import { hashString } from './subtitleCache'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function buildDownloadUrl(params: {
  movieId: string
  slot: 1 | 2
  season?: number
  episode?: number
}): string {
  const query = new URLSearchParams({
    movieId: params.movieId,
    slot: String(params.slot),
    season: String(params.season ?? 0),
    episode: String(params.episode ?? 0),
  })
  return `${API_BASE}/stream/download?${query.toString()}`
}

export function buildSubtitleProxyUrl(params: {
  movieId: string
  season: number
  episode: number
  version?: string
}): string {
  const query = new URLSearchParams({
    movieId: params.movieId,
    season: String(params.season),
    episode: String(params.episode),
  })
  if (params.version) {
    query.set('v', hashString(params.version))
  }
  return `${API_BASE}/subtitle?${query.toString()}`
}
