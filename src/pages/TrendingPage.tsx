import { useTmdbTrending } from '@/hooks/useMovies'
import SEO from '@/components/shared/SEO'
import { IconStar } from '@tabler/icons-react'

export default function TrendingPage() {
  const { data: movies = [], isLoading } = useTmdbTrending()

  return (
    <div className="pt-14">
      <SEO title="Trending" description="Film trending terbaru yang sedang populer." />
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Trending This Week</h1>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-cinema-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {movies.map((m) => (
              <a key={m.id} href={`https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noopener noreferrer" className="group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-cinema-800 mb-2">
                  {m.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-[11px]">No Poster</div>
                  )}
                </div>
                <p className="text-[12px] sm:text-[13px] font-medium truncate text-white/80 group-hover:text-white transition-colors">{m.title}</p>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-white/30">
                  <span className="flex items-center gap-0.5"><IconStar size={10} className="text-yellow-400/70" />{m.vote_average.toFixed(1)}</span>
                  <span>{m.release_date?.slice(0, 4)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
