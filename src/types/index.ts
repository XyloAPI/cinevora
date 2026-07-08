export interface Movie {
  id: string
  slug: string
  title: string
  year: number
  rating: number
  genre: string[]
  poster: string
  backdrop: string
  synopsis: string
  isTrending: boolean
  isFeatured: boolean
  comingSoon: boolean
  releaseDate?: string
  quality?: string
  duration?: string
  type?: 'movie' | 'series'
  episodes?: number
  seasons?: number
  tmdbId?: number
  imdbId?: string
  tagline?: string
  runtime?: number
  budget?: number
  revenue?: number
  originalLanguage?: string
  popularity?: number
  voteCount?: number
  homepage?: string
  director?: string
  cast?: string[]
  logoUrl?: string
  trailerUrl?: string
  streamUrl?: string
  productionCompanies?: string[]
  status?: string
  trendingRank?: number
}

export interface NavLink {
  label: string
  href: string
}

export interface Genre {
  name: string
  href: string
  count: number
}

export interface TmdbConfig {
  baseUrl: string
  secureBaseUrl: string
  posterSizes: string[]
  backdropSizes: string[]
  logoSizes: string[]
  profileSizes: string[]
  stillSizes: string[]
}

export interface TmdbMovieResult {
  id: number
  title: string
  original_title: string
  overview: string
  release_date: string
  vote_average?: number
  vote_count: number
  popularity: number
  poster_path: string | null
  backdrop_path: string | null
  genre_ids: number[]
  original_language: string
  adult: boolean
  video: boolean
  media_type?: string
  name?: string
  first_air_date?: string
}

export interface TmdbMovieDetail {
  id: number
  title?: string
  name?: string
  original_title?: string
  overview: string
  tagline: string
  release_date?: string
  first_air_date?: string
  runtime?: number | null
  episode_run_time?: number[]
  number_of_episodes?: number
  number_of_seasons?: number
  created_by?: { name: string }[]
  vote_average: number
  vote_count: number
  popularity: number
  poster_path: string | null
  backdrop_path: string | null
  budget?: number
  revenue?: number
  homepage: string | null
  imdb_id?: string | null
  original_language: string
  adult: boolean
  status: string
  genres: { id: number; name: string }[]
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[]
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null
}

export interface TmdbVideo {
  key: string
  site: string
  type: string
  name: string
  official: boolean
}

export interface TmdbCredit {
  id: number
  cast: {
    id: number
    name: string
    character: string
    order: number
    profile_path: string | null
  }[]
  crew: {
    id: number
    name: string
    job: string
    department: string
  }[]
}

export interface TmdbGenre {
  id: number
  name: string
}
