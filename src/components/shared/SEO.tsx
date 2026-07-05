import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export default function SEO({ title, description, image, url }: SEOProps) {
  const site = 'Cinevora'
  const fullTitle = title ? `${title} · ${site}` : `${site} · Streaming Film & Series`
  const desc = description ?? 'Streaming film dan serial TV terbaru dengan subtitle Indonesia. Kualitas HD, gratis.'
  const img = image ?? 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=630&fit=crop'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  )
}
