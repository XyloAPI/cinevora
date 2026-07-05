import { Link } from 'react-router-dom'
import { IconArrowLeft, IconMail, IconBrandInstagram, IconBrandX } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO title="Contact" description="Hubungi tim Cinevora" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-6">
          <IconArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-8">Contact Us</h1>
        <div className="space-y-4">
          <a href="mailto:support@cinevora.com" className="flex items-center gap-3 bg-cinema-900 border border-white/[0.06] rounded-lg px-4 py-3 text-sm hover:bg-white/[0.04] transition-colors">
            <IconMail size={18} className="text-cinema-red" />
            <span>support@cinevora.com</span>
          </a>
          <a href="#" className="flex items-center gap-3 bg-cinema-900 border border-white/[0.06] rounded-lg px-4 py-3 text-sm hover:bg-white/[0.04] transition-colors">
            <IconBrandInstagram size={18} className="text-pink-400" />
            <span>@cinevora</span>
          </a>
          <a href="#" className="flex items-center gap-3 bg-cinema-900 border border-white/[0.06] rounded-lg px-4 py-3 text-sm hover:bg-white/[0.04] transition-colors">
            <IconBrandX size={18} className="text-white/70" />
            <span>@cinevora</span>
          </a>
        </div>
      </div>
    </div>
  )
}
