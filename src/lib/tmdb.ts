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

export async function searchMovies(query: string, page: number = 1): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(
    `${API_BASE}/tmdb/search/movie?query=${encodeURIComponent(query)}&page=${page}`
  )
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getTrending(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<{ results: TmdbMovieResult[]; total: number; page: number }> {
  const data = await fetchJson<{ results: TmdbMovieResult[]; total_results: number; page: number }>(
    `${API_BASE}/tmdb/trending/${timeWindow}`
  )
  return { results: data.results, total: data.total_results, page: data.page }
}

export async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
  return fetchJson<TmdbMovieDetail>(`${API_BASE}/tmdb/movie/${tmdbId}`)
}

export async function getMovieVideos(tmdbId: number): Promise<TmdbVideo[]> {
  const data = await fetchJson<{ results: TmdbVideo[] }>(`${API_BASE}/tmdb/movie/${tmdbId}/videos`)
  return data.results
}

export async function getMovieCredits(tmdbId: number): Promise<TmdbCredit> {
  return fetchJson<TmdbCredit>(`${API_BASE}/tmdb/movie/${tmdbId}/credits`)
}

export interface TmdbLogo {
  file_path: string
  width: number
  height: number
  aspect_ratio: number
  iso_639_1: string | null
}

export async function fetchMovieImages(tmdbId: number): Promise<{ logos: TmdbLogo[] }> {
  const data = await fetchJson<{ logos: TmdbLogo[] }>(`${API_BASE}/tmdb/movie/${tmdbId}/images`)
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

export async function enrichMovie(tmdbId: number): Promise<{
  detail: TmdbMovieDetail
  videos: TmdbVideo[]
  credits: TmdbCredit
}> {
  const [detail, videos, credits] = await Promise.all([
    getMovieDetail(tmdbId),
    getMovieVideos(tmdbId),
    getMovieCredits(tmdbId),
  ])
  return { detail, videos, credits }
}

export function mapTmdbToMovie(
  detail: TmdbMovieDetail,
  videos: TmdbVideo[],
  credits: TmdbCredit,
  genreNames: string[],
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
  const year = detail.release_date ? new Date(detail.release_date).getFullYear() : new Date().getFullYear()
  const runtimeMins = detail.runtime
  const hours = runtimeMins ? Math.floor(runtimeMins / 60) : 0
  const mins = runtimeMins ? runtimeMins % 60 : 0
  const durationStr = runtimeMins ? `${hours}h ${mins}m` : null

  return {
    title: detail.title,
    year,
    rating: detail.vote_average,
    genre: genreNames.length ? genreNames : detail.genres.map((g) => g.name),
    poster: imgPath(detail.poster_path),
    backdrop: imgOriginal(detail.backdrop_path),
    synopsis: detail.overview,
    releaseDate: detail.release_date || '',
    quality: null,
    duration: durationStr,
    runtime: runtimeMins,
    type: 'movie',
    tmdbId: detail.id,
    imdbId: detail.imdb_id || undefined,
    tagline: detail.tagline || '',
    budget: detail.budget,
    revenue: detail.revenue,
    originalLanguage: detail.original_language,
    popularity: detail.popularity,
    voteCount: detail.vote_count,
    homepage: detail.homepage || undefined,
    director: getDirector(credits),
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