import type { Genre } from '@/types'

export const genres: Genre[] = [
  { name: 'Action', href: '/', count: 156 },
  { name: 'Drama', href: '/', count: 203 },
  { name: 'Horror', href: '/', count: 89 },
  { name: 'Sci-Fi', href: '/', count: 112 },
  { name: 'Comedy', href: '/', count: 178 },
  { name: 'Thriller', href: '/', count: 95 },
  { name: 'Romance', href: '/', count: 134 },
  { name: 'Fantasy', href: '/', count: 77 },
  { name: 'Animation', href: '/', count: 63 },
  { name: 'Documentary', href: '/', count: 42 },
  { name: 'Crime', href: '/', count: 88 },
  { name: 'Adventure', href: '/', count: 121 },
]

export const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Trending', href: '/trending' },
  { label: 'Movies', href: '/movies' },
  { label: 'Series', href: '/series' },
  { label: 'Genres', href: '/genres' },
]

export const footerLinks = [
  { title: 'Navigation', items: [{ label: 'Home', href: '/' }, { label: 'Movies', href: '/movies' }, { label: 'Series', href: '/series' }, { label: 'Genre', href: '/genres' }, { label: 'Trending', href: '/trending' }] },
  { title: 'Support', items: [{ label: 'FAQ', href: '/faq' }, { label: 'Contact', href: '/contact' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }] },
]
