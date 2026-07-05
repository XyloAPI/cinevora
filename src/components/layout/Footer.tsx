import { Link } from 'react-router-dom'
import Container from './Container'
import { footerLinks } from '@/data/movies'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-cinema-950 mt-16">
      <Container className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img src="/Cinevora.avif" alt="Cinevora" className="h-8" />
            </Link>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              Streaming film dan serial TV terbaru dengan subtitle Indonesia. Kualitas HD, gratis.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 text-xs text-white/20">
          <p>&copy; 2026 Cinevora. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}
