import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function MovieCardSkeleton() {
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
