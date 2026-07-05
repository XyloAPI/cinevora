import { Link } from 'react-router-dom'
import type { Genre } from '@/types'

interface CategoriesGridProps {
  genres?: Genre[]
}

export default function CategoriesGrid({ genres = [] }: CategoriesGridProps) {
  return (
    <section id="genres" className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold">Browse by Genre</h2>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {genres.map((genre) => (
            <Link
              key={genre.name}
              to={genre.href}
              className="block px-3 py-2.5 rounded-lg bg-cinema-900 hover:bg-cinema-800 border border-white/[0.04] hover:border-white/10 transition-all text-center"
            >
              <span className="text-[13px] font-medium text-white/60 group-hover:text-white transition-colors block">
                {genre.name}
              </span>
              <span className="text-[10px] text-white/20">{genre.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
