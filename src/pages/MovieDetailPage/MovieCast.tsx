import React, { useRef, useState } from 'react'
import { IconStar } from '@tabler/icons-react'

interface CastMember {
  id: number
  name: string
  character: string
  photo: string | undefined
}

interface MovieCastProps {
  cast: CastMember[]
}

export default function MovieCast({ cast }: MovieCastProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scroll: 0 })

  function handleMouseDown(e: React.MouseEvent) {
    if (!scrollRef.current) return
    setIsDragging(true)
    dragStart.current = { x: e.pageX, scroll: scrollRef.current.scrollLeft }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const dx = e.pageX - dragStart.current.x
    scrollRef.current.scrollLeft = dragStart.current.scroll - dx
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  if (cast.length === 0) return null

  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-base font-bold mb-5 flex items-center gap-2">
        <IconStar size={16} className="text-cinema-red" /> Cast
      </h2>
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex gap-4 sm:gap-6 overflow-x-auto cursor-grab active:cursor-grabbing select-none scroll-hidden"
      >
        {cast.map((c) => (
          <div key={c.id} className="flex flex-col items-center text-center shrink-0 w-24 sm:w-28">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-cinema-800 border-2 border-white/[0.06] mb-2">
              {c.photo ? (
                <img src={c.photo} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold">
                  {c.name.charAt(0)}
                </div>
              )}
            </div>
            <p className="text-[12px] font-medium leading-tight truncate w-full">{c.name}</p>
            <p className="text-[10px] text-white/30 truncate w-full">{c.character}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
