import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMovieBySlug, useRelatedMovies } from '@/hooks/useMovies'
import MovieRow from '@/components/sections/MovieRow'
import SEO from '@/components/shared/SEO'
import * as tmdb from '@/lib/tmdb'
import MovieHeroInfo from './MovieHeroInfo'
import MovieCast from './MovieCast'

export default function MovieDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: movie } = useMovieBySlug(slug)
  const { data: related = [] } = useRelatedMovies(movie ?? null)
  const [logo, setLogo] = useState<string | undefined>(movie?.logoUrl)
  const [cast, setCast] = useState<{ id: number; name: string; character: string; photo: string | undefined }[]>([])
  const [companies, setCompanies] = useState<{ name: string; logoUrl?: string }[]>([])
  const [trailer, setTrailer] = useState<string | undefined>()

  useEffect(() => {
    setLogo(movie?.logoUrl)
    if (!movie?.tmdbId) return
    const id = movie.tmdbId
    if (!movie?.logoUrl) {
      tmdb
        .fetchMovieImages(id)
        .then(({ logos }) => setLogo(tmdb.logoUrl(logos)))
        .catch(() => {})
    }
    tmdb
      .getMovieCredits(id)
      .then((c) => setCast(tmdb.castWithPhotos(c)))
      .catch(() => {})
    tmdb
      .getMovieVideos(id)
      .then((v) => setTrailer(tmdb.trailerUrl(v)))
      .catch(() => {})
    tmdb
      .getMovieDetail(id)
      .then((d) => {
        setCompanies(
          (d.production_companies || []).map((c) => ({
            name: c.name,
            logoUrl: c.logo_path ? `https://image.tmdb.org/t/p/w200${c.logo_path}` : undefined,
          }))
        )
      })
      .catch(() => {})
  }, [movie?.tmdbId])

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-14">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Movie not found</h1>
          <Link to="/" className="text-cinema-red hover:underline text-sm">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO title={movie.title} description={movie.synopsis} image={movie.backdrop} url={`/movie/${slug}`} movie={movie} />

      {/* Main Movie Hero Section - Subcomponent */}
      <MovieHeroInfo movie={movie} slug={slug} logo={logo} trailer={trailer} companies={companies} />

      {/* Cast Section - Subcomponent */}
      <MovieCast cast={cast} />

      {/* Related Movies */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-10">
        <MovieRow title="Related Movies" movies={related} />
      </section>
    </div>
  )
}
