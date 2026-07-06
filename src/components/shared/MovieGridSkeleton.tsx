import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface MovieGridSkeletonProps {
  count?: number
}

export default function MovieGridSkeleton({ count = 12 }: MovieGridSkeletonProps) {
  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <Skeleton className="!h-5 !w-40" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(185px,1fr))] gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="w-full">
              <div className="aspect-[2/3] rounded-lg overflow-hidden">
                <Skeleton className="!h-full !w-full !leading-none" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
              </div>
              <div className="mt-1.5 space-y-1">
                <Skeleton className="!h-3.5 !w-3/4" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
                <Skeleton className="!h-3 !w-1/3" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
