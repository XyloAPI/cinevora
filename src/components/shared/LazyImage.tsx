import { useInView } from 'react-intersection-observer'

interface LazyImageProps {
  src: string
  alt: string
}

export default function LazyImage({ src, alt }: LazyImageProps) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })

  return (
    <img
      ref={ref}
      src={inView ? src : undefined}
      alt={alt}
      className="w-full h-full object-cover"
      draggable="false"
      style={inView ? {} : { background: '#1a1a2e' }}
    />
  )
}
