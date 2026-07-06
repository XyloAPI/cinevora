import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function HeroSkeleton() {
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
