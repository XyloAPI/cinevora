import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import MovieCardSkeleton from './MovieCardSkeleton'

export default function MovieRowSkeleton() {
  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <Skeleton className="!h-5 !w-40" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
