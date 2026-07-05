import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export function MovieCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[170px] sm:w-[185px]">
      <div className="aspect-[2/3] rounded-lg overflow-hidden">
        <Skeleton className="!h-full !w-full !leading-none" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
      </div>
      <div className="mt-1.5 space-y-1">
        <Skeleton className="!h-3.5 !w-3/4" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
        <Skeleton className="!h-3 !w-1/3" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
      </div>
    </div>
  )
}

export function MovieRowSkeleton() {
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

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
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

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[80vh] flex items-end pt-14">
      <div className="absolute inset-0">
        <Skeleton className="!w-full !h-full !leading-none" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
      </div>
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="max-w-xl space-y-3">
          <Skeleton className="!h-4 !w-32" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          <Skeleton className="!h-12 !w-full" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          <Skeleton className="!h-4 !w-64" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          <Skeleton className="!h-4 !w-full" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          <Skeleton className="!h-4 !w-3/4" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="!h-10 !w-28 !rounded" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
            <Skeleton className="!h-10 !w-24 !rounded" baseColor="#1a1a2e" highlightColor="#2a2a3e" />
          </div>
        </div>
      </div>
    </section>
  )
}
