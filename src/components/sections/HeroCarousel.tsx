import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { IconPlayerPlayFilled, IconInfoCircle } from '@tabler/icons-react'
import { useTrendingFromDb } from '@/hooks/useMovies'

export default function HeroCarousel() {
  const { data: slides = [] } = useTrendingFromDb()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi) return
    const timer = setInterval(() => emblaApi.scrollNext(), 5000)
    return () => clearInterval(timer)
  }, [emblaApi])

  if (!slides.length) return null

  return (
    <section className="relative min-h-[80vh] pt-14">
      <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((movie, i) => (
            <div key={movie.id} className="relative min-w-0 flex-[0_0_100%] h-full">
              <img
                src={movie.backdrop}
                alt=""
                fetchPriority={i === 0 ? 'high' : 'auto'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/70 to-cinema-950/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/90 via-cinema-950/50 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 md:pb-20 h-[80vh] flex flex-col justify-end">
        {slides.map((movie, i) => (
          <div key={movie.id} className={`transition-opacity duration-500 ${i === selected ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
            {i === selected && (
              <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="px-2 py-0.5 bg-cinema-red text-white text-[10px] font-semibold uppercase tracking-wider rounded-sm">
                    #1 Trending
                  </span>
                  <span className="text-sm text-yellow-400 font-medium">&#9733; {movie.rating}/10</span>
                  <span className="text-sm text-white/40">{movie.year}</span>
                  <span className="text-xs text-white/30 px-1.5 py-0.5 border border-white/10 rounded">{movie.quality}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-3">
                  {movie.title}
                </h1>

                <div className="flex items-center gap-2 text-xs text-white/30 mb-3 flex-wrap">
                  {movie.genre.map((g) => (
                    <span key={g} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-cinema-red/70" />
                      {g}
                    </span>
                  ))}
                  <span className="ml-1">{movie.duration}</span>
                </div>

                <p className="text-sm md:text-base text-white/50 leading-relaxed max-w-md mb-5 line-clamp-2">
                  {movie.synopsis}
                </p>

                <div className="flex items-center gap-3">
                  <Link to={`/movie/${movie.slug}`} className="flex items-center gap-2 px-5 py-2.5 bg-cinema-red text-white font-medium rounded hover:bg-cinema-red-dark transition-colors text-sm">
                    <IconPlayerPlayFilled size={16} />
                    Play Now
                  </Link>
                  <Link to={`/movie/${movie.slug}`} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.08] text-white/70 hover:text-white font-medium rounded hover:bg-white/[0.12] transition-colors text-sm">
                    <IconInfoCircle size={16} />
                    Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 mt-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${i === selected ? 'w-8 bg-cinema-red' : 'w-4 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
