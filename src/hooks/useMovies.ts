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
        const all = await db.fetchAllMovies()
        if (!all || all.length === 0) return [] as Movie[]

        try {
          const tmdbModule = await import('@/lib/tmdb')
          const trending = await tmdbModule.getTrending('week', 1)
          if (trending && trending.results && trending.results.length > 0) {
            const trendingOrder = new Map(trending.results.map((r: { id: number }, idx: number) => [r.id, idx + 1]))
            const filtered = all.filter((m) => m.tmdbId && trendingOrder.has(Number(m.tmdbId)))
            if (filtered.length > 0) {
              filtered.sort((a, b) => (trendingOrder.get(Number(a.tmdbId)) || 999) - (trendingOrder.get(Number(b.tmdbId)) || 999))
              return filtered.map((m) => ({ ...m, trendingRank: trendingOrder.get(Number(m.tmdbId)) }))
            }
          }
        } catch (e) {
          console.warn('TMDB trending fetch failed, using fallback:', e)
        }

        // Fallback: movies with isTrending = true, or latest 6 movies
        const dbTrending = all.filter((m) => m.isTrending)
        if (dbTrending.length > 0) {
          return dbTrending.map((m, idx) => ({ ...m, trendingRank: idx + 1 }))
        }
        return all.slice(0, 6).map((m, idx) => ({ ...m, trendingRank: idx + 1 }))
      } catch {
        return [] as Movie[]
      }
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function useCategoryFromDb(
  category: 'trending' | 'now_playing' | 'popular' | 'top_rated',
  region: string = '',
  queryKeyExtra: string = ''
) {
  return useQuery({
    queryKey: ['movies', 'category-db', category, region, queryKeyExtra],
    queryFn: async () => {
      try {
        const all = await db.fetchAllMovies()
        if (!all || all.length === 0) return [] as Movie[]

        try {
          const tmdbModule = await import('@/lib/tmdb')
          const res = await tmdbModule.getMoviesByCategory(category, region, 1)
          if (res && res.results && res.results.length > 0) {
            const orderMap = new Map(res.results.map((r: { id: number }, idx: number) => [r.id, idx + 1]))
            const filtered = all.filter((m) => m.tmdbId && orderMap.has(Number(m.tmdbId)))
            if (filtered.length > 0) {
              filtered.sort((a, b) => (orderMap.get(Number(a.tmdbId)) || 999) - (orderMap.get(Number(b.tmdbId)) || 999))
              return filtered
            }
          }
        } catch (e) {
          console.warn(`TMDB category ${category} fetch failed, using fallback:`, e)
        }

        if (category === 'top_rated') {
          return [...all].sort((a, b) => b.rating - a.rating).slice(0, 12)
        }
        return all.slice(0, 12)
      } catch {
        return [] as Movie[]
      }
    },
    staleTime: 1000 * 60 * 60,
  })
}

export function usePlatformMoviesFromDb(
  providerId: number,
  region: string = 'ID'
) {
  return useQuery({
    queryKey: ['movies', 'platform-db', providerId, region],
    queryFn: async () => {
      try {
        const all = await db.fetchAllMovies()
        if (!all || all.length === 0) return [] as Movie[]

        try {
          const tmdbModule = await import('@/lib/tmdb')
          const [resMovies, resSeries] = await Promise.all([
            tmdbModule.getDiscoverByProvider(providerId, 'movie', region, 1),
            tmdbModule.getDiscoverByProvider(providerId, 'series', region, 1)
          ])

          const combined = [
            ...(resMovies?.results || []),
            ...(resSeries?.results || [])
          ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

          if (combined.length > 0) {
            const orderMap = new Map(combined.map((r: { id: number }, idx: number) => [r.id, idx + 1]))
            const filtered = all.filter((m) => m.tmdbId && orderMap.has(Number(m.tmdbId)))
            if (filtered.length > 0) {
              filtered.sort((a, b) => (orderMap.get(Number(a.tmdbId)) || 999) - (orderMap.get(Number(b.tmdbId)) || 999))
              return filtered
            }
          }
        } catch (e) {
          console.warn(`TMDB platform discovery ${providerId} fetch failed, using fallback:`, e)
        }

        // Fallback: return empty (or you can return first 12 movies, but empty is better so the row doesn't show duplicates of unrelated movies)
        return [] as Movie[]
      } catch {
        return [] as Movie[]
      }
    },
    staleTime: 1000 * 60 * 60,
  })
}


