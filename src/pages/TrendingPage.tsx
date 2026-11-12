import { useParams } from 'react-router-dom'
import { useCategoryFromDb, usePlatformMoviesFromDb, useTrendingFromDb } from '@/hooks/useMovies'
import MovieGrid from '@/components/sections/MovieGrid'
import SEO from '@/components/shared/SEO'
import { MovieGridSkeleton } from '@/components/shared/Skeleton'

const categories = {
  indonesia: { key: 'trending', title: 'Populer di Indonesia', region: 'ID' },
  'now-playing': { key: 'now_playing', title: 'Sedang Tayang di Bioskop', region: 'ID' },
  popular: { key: 'popular', title: 'Film Terpopuler', region: 'ID' },
  'top-rated': { key: 'top_rated', title: 'Rating Tertinggi', region: 'ID' },
} as const

const providers = {
  netflix: { id: 8, title: 'Netflix', region: 'ID' },
  'disney-plus': { id: 122, title: 'Disney+ Hotstar', region: 'ID' },
  viu: { id: 158, title: 'Viu', region: 'ID' },
  'prime-video': { id: 119, title: 'Prime Video', region: 'ID' },
  'hbo-max': { id: 1899, title: 'HBO Max', region: 'ID' },
  'apple-tv': { id: 350, title: 'Apple TV+', region: 'ID' },
  iqiyi: { id: 581, title: 'iQIYI', region: 'US' },
  crunchyroll: { id: 283, title: 'Crunchyroll', region: 'ID' },
  wetv: { id: 623, title: 'WeTV', region: 'ID' },
  vidio: { id: 489, title: 'Vidio', region: 'ID' },
  klikfilm: { id: 576, title: 'KlikFilm', region: 'ID' },
  'vision-plus': { id: 5756, title: 'Vision+', region: 'ID' },
}

export default function TrendingPage() {
  const { list } = useParams()
  const category = list && list in categories
    ? categories[list as keyof typeof categories]
    : null
  const provider = list && list in providers
    ? providers[list as keyof typeof providers]
    : null

  const trendingQuery = useTrendingFromDb(!category && !provider)
  const categoryQuery = useCategoryFromDb(category?.key || 'trending', category?.region || 'ID', '', !!category)
  const providerQuery = usePlatformMoviesFromDb(provider?.id || 8, provider?.region || 'ID', !!provider)

  const { data: movies = [], isLoading } = provider
    ? providerQuery
    : category
      ? categoryQuery
      : trendingQuery
  const title = provider
    ? `Populer di ${provider.title}`
    : category
      ? category.title
      : 'Populer Minggu Ini'

  return (
    <div className="pt-14">
      <SEO title={title} description={`${title}: film dan serial pilihan.`} />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">{title}</h1>
        {isLoading ? <MovieGridSkeleton count={12} /> : <MovieGrid title="" movies={movies} />}
      </div>
    </div>
  )
}
