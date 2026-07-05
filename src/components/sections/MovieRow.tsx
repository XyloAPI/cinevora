import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '@/components/shared/MovieCard'
import type { Movie } from '@/types'

interface MovieRowProps {
  title: string
  movies: Movie[]
  id?: string
}

export default function MovieRow({ title, movies, id }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })

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

  return (
    <section id={id} className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold">{title}</h2>
          <Link to="/" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">View All</Link>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={rowRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          className={`flex gap-3 overflow-x-auto scroll-hidden pb-1 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onDragStart={(e) => e.preventDefault()}
          style={{ scrollBehavior: dragging ? 'auto' : 'smooth' }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} compact />
          ))}
        </div>
      </div>
    </section>
  )
}
