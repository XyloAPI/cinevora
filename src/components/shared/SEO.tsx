import { Helmet } from 'react-helmet-async'
import type { Movie } from '@/types'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  movie?: Movie
}

export default function SEO({ title, description, image, url, movie }: SEOProps) {
  const site = 'Cinevora'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cinevora.biz.id'
  
  // Dynamic variables
  const fullTitle = title 
    ? `${title} · ${site}` 
    : `${site} · Nonton Film Streaming & Series Sub Indo Gratis`
  
  const desc = description ?? movie?.synopsis ?? 'Streaming film dan serial TV terbaru dengan subtitle Indonesia. Kualitas HD, gratis tanpa iklan mengganggu.'
  const img = image ?? movie?.backdrop ?? movie?.poster ?? `${origin}/Cinevora.avif`
  const canonicalUrl = url ? `${origin}${url}` : typeof window !== 'undefined' ? window.location.href : origin

  // Generate structured data (JSON-LD)
  let schemaData: any = null

  if (movie) {
    if (movie.type === 'series') {
      schemaData = {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": movie.title,
        "description": movie.synopsis || desc,
        "image": img,
        "dateCreated": movie.releaseDate || String(movie.year),
        "genre": movie.genre,
        "numberOfEpisodes": movie.episodes,
        "numberOfSeasons": movie.seasons,
        "aggregateRating": movie.rating ? {
          "@type": "AggregateRating",
          "ratingValue": String(movie.rating),
          "bestRating": "10",
          "ratingCount": movie.voteCount ? String(movie.voteCount) : "100"
        } : undefined,
        "actor": movie.cast?.map(c => ({
          "@type": "Person",
          "name": c
        })),
        "director": movie.director ? {
          "@type": "Person",
          "name": movie.director
        } : undefined
      }
    } else {
      schemaData = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": movie.title,
        "description": movie.synopsis || desc,
        "image": img,
        "datePublished": movie.releaseDate || String(movie.year),
        "genre": movie.genre,
        "duration": movie.duration || undefined,
        "aggregateRating": movie.rating ? {
          "@type": "AggregateRating",
          "ratingValue": String(movie.rating),
          "bestRating": "10",
          "ratingCount": movie.voteCount ? String(movie.voteCount) : "100"
        } : undefined,
        "actor": movie.cast?.map(c => ({
          "@type": "Person",
          "name": c
        })),
        "director": movie.director ? {
          "@type": "Person",
          "name": movie.director
        } : undefined
      }
    }
  } else {
    // General website schema
    schemaData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": site,
      "url": origin,
      "description": desc,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${origin}/movies?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  }

  // Keywords generator based on title and genres
  const defaultKeywords = 'nonton film, streaming movie, nonton series, bioskop online, streaming hd, sub indo, lk21, indoxxi, cinevora'
  const movieKeywords = movie 
    ? `${movie.title.toLowerCase()}, nonton ${movie.title.toLowerCase()}, streaming ${movie.title.toLowerCase()}, ${movie.genre.join(', ').toLowerCase()}, sub indo` 
    : ''
  const keywords = movieKeywords ? `${movieKeywords}, ${defaultKeywords}` : defaultKeywords

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={desc} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={movie ? 'video.other' : 'website'} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:site_name" content={site} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* JSON-LD Structured Data */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  )
}
