import type { NavLink } from '@/types'


export const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Populer', href: '/trending' },
  { label: 'Film', href: '/movies' },
  { label: 'Serial', href: '/series' },
  { label: 'Genre', href: '/genres' },
]

export const footerLinks = [
  { title: 'Navigasi', items: [{ label: 'Beranda', href: '/' }, { label: 'Film', href: '/movies' }, { label: 'Serial', href: '/series' }, { label: 'Genre', href: '/genres' }, { label: 'Populer', href: '/trending' }] },
  { title: 'Bantuan', items: [{ label: 'FAQ', href: '/faq' }, { label: 'Privasi', href: '/privacy' }, { label: 'Ketentuan', href: '/terms' }] },
]
