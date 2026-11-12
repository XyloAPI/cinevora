import { useRef, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '@/components/shared/MovieCard'
import type { Movie } from '@/types'

interface MovieRowProps {
  title: React.ReactNode
  movies: Movie[]
  id?: string
  viewAllHref?: string
}

export default function MovieRow({ title, movies, id, viewAllHref }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })
  const wheelTarget = useRef<number | null>(null)
  const wheelFrame = useRef<number | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!rowRef.current) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = {
      x: e.pageX,
      scrollLeft: rowRef.current.scrollLeft,
    }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !rowRef.current) return
    e.preventDefault()
    const dx = e.pageX - dragStart.current.x
    rowRef.current.scrollLeft = dragStart.current.scrollLeft - dx
  }, [dragging])

  const onMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  const onMouseLeave = useCallback(() => {
    if (dragging) setDragging(false)
  }, [dragging])

  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      const maxScroll = row.scrollWidth - row.clientWidth
      const currentTarget = wheelTarget.current ?? row.scrollLeft
      const nextTarget = Math.max(0, Math.min(maxScroll, currentTarget + delta))
      if (nextTarget === currentTarget) return

      event.preventDefault()
      wheelTarget.current = nextTarget

      if (wheelFrame.current !== null) return

      let previousTime = 0
      const animate = (time: number) => {
        if (previousTime === 0) previousTime = time
        const elapsed = Math.min(time - previousTime, 32)
        previousTime = time

        const remaining = (wheelTarget.current ?? row.scrollLeft) - row.scrollLeft
        if (Math.abs(remaining) < 0.5) {
          row.scrollLeft = wheelTarget.current ?? row.scrollLeft
          wheelTarget.current = null
          wheelFrame.current = null
          return
        }

        row.scrollLeft += remaining * (1 - Math.exp(-elapsed / 45))
        wheelFrame.current = window.requestAnimationFrame(animate)
      }

      wheelFrame.current = window.requestAnimationFrame(animate)
    }

    row.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      row.removeEventListener('wheel', onWheel)
      if (wheelFrame.current !== null) window.cancelAnimationFrame(wheelFrame.current)
    }
  }, [])

  return (
    <section id={id} className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold">{title}</h2>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-[13px] text-white/30 hover:text-white/60 transition-colors">
              Lihat Semua
            </Link>
          )}
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={rowRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          className={`flex gap-3 overflow-x-auto scroll-hidden pt-2 pb-4 px-1 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onDragStart={(e) => e.preventDefault()}
          style={{ scrollBehavior: 'auto' }}
        >
          {movies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} compact fetchPriority={i < 4 ? 'high' : 'auto'} />
          ))}
        </div>
      </div>
    </section>
  )
}
