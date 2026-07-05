import type { NavLink } from '@/types'


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
