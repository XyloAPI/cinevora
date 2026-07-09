import type { TmdbMovieResult, TmdbMovieDetail, TmdbVideo, TmdbCredit, TmdbGenre } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const IMG_BASE = 'https://image.tmdb.org/t/p'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

const genreCache = new Map<number, string>()

export async function fetchGenres(): Promise<TmdbGenre[]> {
  const data = await fetchJson<{ genres: TmdbGenre[] }>(`${API_BASE}/tmdb/genre/movie/list`)
  for (const g of data.genres) genreCache.set(g.id, g.name)
  return data.genres
}

export async function searchMovies(query: string, type: 'movie' | 'series' = 'movie', page: number = 1): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const endpointType = type === 'series' ? 'tv' : 'movie'
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(
    `${API_BASE}/tmdb/search/${endpointType}?query=${encodeURIComponent(query)}&page=${page}`
  )
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getTrending(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(
    `${API_BASE}/tmdb/trending/${timeWindow}`
  )
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getMoviesByCategory(
  category: 'trending' | 'now_playing' | 'popular' | 'top_rated',
  region: string = '',
  page: number = 1
): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const path = `${API_BASE}/tmdb/list/${category}?page=${page}${region ? `&region=${region}` : ''}`
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(path)
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getDiscoverByProvider(
  providerId: number,
  type: 'movie' | 'series' = 'movie',
  region: string = 'ID',
  page: number = 1
): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const path = `${API_BASE}/tmdb/discover?with_watch_providers=${providerId}&watch_region=${region}&type=${type}&page=${page}`
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(path)
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getMovieDetail(tmdbId: number, type: 'movie' | 'series' = 'movie'): Promise<TmdbMovieDetail> {
  const pathType = type === 'series' ? 'tv' : 'movie'
  return fetchJson<TmdbMovieDetail>(`${API_BASE}/tmdb/${pathType}/${tmdbId}`)
}

export async function getMovieVideos(tmdbId: number, type: 'movie' | 'series' = 'movie'): Promise<TmdbVideo[]> {
  const pathType = type === 'series' ? 'tv' : 'movie'
  const data = await fetchJson<{ results: TmdbVideo[] }>(`${API_BASE}/tmdb/${pathType}/${tmdbId}/videos`)
  return data.results
}

export async function getMovieCredits(tmdbId: number, type: 'movie' | 'series' = 'movie'): Promise<TmdbCredit> {
  const pathType = type === 'series' ? 'tv' : 'movie'
  return fetchJson<TmdbCredit>(`${API_BASE}/tmdb/${pathType}/${tmdbId}/credits`)
}

export interface TmdbLogo {
  file_path: string
  width: number
  height: number
  aspect_ratio: number
  iso_639_1: string | null
}

export async function fetchMovieImages(tmdbId: number, type: 'movie' | 'series' = 'movie'): Promise<{ logos: TmdbLogo[] }> {
  const pathType = type === 'series' ? 'tv' : 'movie'
  const data = await fetchJson<{ logos: TmdbLogo[] }>(`${API_BASE}/tmdb/${pathType}/${tmdbId}/images`)
  return { logos: data.logos }
}

export function logoUrl(logos: TmdbLogo[]): string | undefined {
  const english = logos.find((l) => l.iso_639_1 === 'en') || logos[0]
  return english ? imgOriginal(english.file_path) : undefined
}

export function castWithPhotos(credits: TmdbCredit, limit: number = 12) {
  return credits.cast.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
  }))
}

export function trailerUrl(videos: TmdbVideo[]): string | undefined {
  const trailer = videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official)
    || videos.find((v) => v.type === 'Trailer' && v.site === 'YouTube')
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined
}

export function getDirector(credits: TmdbCredit): string | undefined {
  return credits.crew.find((c) => c.job === 'Director')?.name
}

export async function enrichMovie(tmdbId: number, type: 'movie' | 'series' = 'movie'): Promise<{
  detail: TmdbMovieDetail
  videos: TmdbVideo[]
  credits: TmdbCredit
}> {
  const [detail, videos, credits] = await Promise.all([
    getMovieDetail(tmdbId, type),
    getMovieVideos(tmdbId, type),
    getMovieCredits(tmdbId, type),
  ])
  return { detail, videos, credits }
}

export function mapTmdbToMovie(
  detail: TmdbMovieDetail,
  videos: TmdbVideo[],
  credits: TmdbCredit,
  genreNames: string[],
  type: 'movie' | 'series' = 'movie',
): {
  title: string
  year: number
  rating: number
  genre: string[]
  poster: string
  backdrop: string
  synopsis: string
  releaseDate: string
  quality: string | null
  duration: string | null
  runtime: number | null
  type: 'movie' | 'series'
  episodes: number | undefined
  seasons: number | undefined
  tmdbId: number
  imdbId: string | undefined
  tagline: string
  budget: number
  revenue: number
  originalLanguage: string
  popularity: number
  voteCount: number
  homepage: string | undefined
  director: string | undefined
  cast: string[]
  trailerUrl: string | undefined
  productionCompanies: string[]
  status: string
  isTrending: boolean
  isFeatured: boolean
  comingSoon: boolean
} {
  const releaseDate = detail.release_date || detail.first_air_date || ''
  const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear()
  
  let runtimeMins = detail.runtime
  if (type === 'series' && detail.episode_run_time && detail.episode_run_time.length > 0) {
    runtimeMins = detail.episode_run_time[0]
  }
  
  const hours = runtimeMins ? Math.floor(runtimeMins / 60) : 0
  const mins = runtimeMins ? runtimeMins % 60 : 0
  const durationStr = runtimeMins ? `${hours}h ${mins}m` : null

  return {
    title: detail.title || detail.name || '',
    year,
    rating: detail.vote_average,
    genre: genreNames.length ? genreNames : detail.genres.map((g) => g.name),
    poster: imgPath(detail.poster_path),
    backdrop: imgOriginal(detail.backdrop_path),
    synopsis: detail.overview,
    releaseDate,
    quality: null,
    duration: durationStr,
    runtime: runtimeMins || null,
    type,
    episodes: detail.number_of_episodes,
    seasons: detail.number_of_seasons,
    tmdbId: detail.id,
    imdbId: detail.imdb_id || undefined,
    tagline: detail.tagline || '',
    budget: detail.budget || 0,
    revenue: detail.revenue || 0,
    originalLanguage: detail.original_language,
    popularity: detail.popularity,
    voteCount: detail.vote_count,
    homepage: detail.homepage || undefined,
    director: getDirector(credits) || detail.created_by?.[0]?.name,
    cast: getCast(credits),
    trailerUrl: trailerUrl(videos),
    productionCompanies: detail.production_companies.map((c) => c.name),
    status: detail.status,
    isTrending: false,
    isFeatured: false,
    comingSoon: false,
  }
}

function imgPath(path: string | null, size: string = 'w500'): string {
  return path ? `${IMG_BASE}/${size}${path}` : ''
}

function imgOriginal(path: string | null): string {
  return path ? `${IMG_BASE}/original${path}` : ''
}

function getCast(credits: TmdbCredit, limit: number = 10): string[] {
  return credits.cast.slice(0, limit).map((c) => c.name)
}