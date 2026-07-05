import { useQuery } from '@tanstack/react-query'
import { movieSchema } from '@/lib/schemas'
import * as db from '@/lib/db'
import type { Movie } from '@/types'

export function useAllMovies() {
  return useQuery({
    queryKey: ['movies', 'all'],
    queryFn: async () => { try { return (await db.fetchAllMovies()) ?? [] } catch { return [] as Movie[] } },
  })
}

export function useTrendingMovies() {
  return useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: async () => { try { return (await db.fetchTrendingMovies()) ?? [] } catch { return [] as Movie[] } },
  })
}

export function useSeries() {
  return useQuery({
    queryKey: ['movies', 'series'],
    queryFn: async () => { try { return (await db.fetchSeries()) ?? [] } catch { return [] as Movie[] } },
  })
}

export function useLatestMovies() {
  return useQuery({
    queryKey: ['movies', 'latest'],
    queryFn: async () => { try { return (await db.fetchLatestMovies()) ?? [] } catch { return [] as Movie[] } },
  })
}

export function useComingSoon() {
  return useQuery({
    queryKey: ['movies', 'coming-soon'],
    queryFn: async () => { try { return (await db.fetchComingSoon()) ?? [] } catch { return [] as Movie[] } },
  })
}

export function useMovieBySlug(slug: string) {
  return useQuery({
    queryKey: ['movies', 'slug', slug],
    queryFn: async () => { try { return (await db.fetchMovieBySlug(slug)) ?? null } catch { return null } },
    enabled: !!slug,
  })
}

export function useFeaturedMovie() {
  return useQuery({
    queryKey: ['movies', 'featured'],
    queryFn: async () => { try { return (await db.fetchFeaturedMovie()) ?? null } catch { return null } },
  })
}

export function useRelatedMovies(movie: Movie | null) {
  return useQuery({
    queryKey: ['movies', 'related', movie?.id],
    queryFn: async () => {
      if (!movie) return [] as Movie[]
      try {
        const all = (await db.fetchAllMovies()) ?? []
        return all.filter((m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g))).slice(0, 10)
      } catch {
        return [] as Movie[]
      }
    },
    enabled: !!movie,
  })
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => { try { return (await db.getGenres()) ?? [] } catch { return [] } },
  })
}

export function useTmdbTrending() {
  return useQuery({
    queryKey: ['tmdb', 'trending'],
    queryFn: async () => {
      try {
        const { getTrending } = await import('@/lib/tmdb')
        const data = await getTrending('week', 1)
        return data.results
      } catch { return [] }
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function useTmdbPopular() {
  return useQuery({
    queryKey: ['tmdb', 'popular'],
    queryFn: async () => {
      try {
        const { getPopular } = await import('@/lib/tmdb')
        const data = await getPopular(1)
        return data.results
      } catch { return [] }
    },
    staleTime: 1000 * 60 * 60,
  })
}

export { movieSchema }
