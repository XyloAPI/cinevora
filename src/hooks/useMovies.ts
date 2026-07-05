import { useQuery } from '@tanstack/react-query'
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
        return all.filter((m) => m.id !== movie.id && m.genre.some((g: string) => movie.genre.includes(g))).slice(0, 10)
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

export function useTrendingFromDb() {
  return useQuery({
    queryKey: ['movies', 'trending-from-db'],
    queryFn: async () => {
      try {
        const [all, tmdbModule] = await Promise.all([db.fetchAllMovies(), import('@/lib/tmdb')])
        if (!all) return [] as Movie[]
        const trending = await tmdbModule.getTrending('week', 1)
        const trendingOrder = new Map(trending.results.map((r: { id: number }, idx: number) => [r.id, idx + 1]))
        const filtered = all.filter((m) => m.tmdbId && trendingOrder.has(m.tmdbId))
        filtered.sort((a, b) => (trendingOrder.get(a.tmdbId!) || 999) - (trendingOrder.get(b.tmdbId!) || 999))
        // assign trending rank to each movie
        const withRank = filtered.map((m) => ({ ...m, trendingRank: trendingOrder.get(m.tmdbId!) }))
        return withRank
      } catch { return [] as Movie[] }
    },
    staleTime: 1000 * 60 * 60,
  })
}


