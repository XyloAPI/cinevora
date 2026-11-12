import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'

const faqs = [
  { q: 'Apa itu Cinevora?', a: 'Cinevora adalah platform streaming film dan serial TV yang menyediakan subtitle Indonesia. Kami mengkurasi konten terbaik dari berbagai genre.' },
  { q: 'Apakah Cinevora gratis?', a: 'Ya, Cinevora gratis untuk digunakan. Kami tidak memungut biaya berlangganan untuk menonton konten yang tersedia.' },
  { q: 'Bagaimana cara menonton film?', a: 'Cukup cari film yang ingin ditonton, klik judulnya, lalu tekan tombol "Watch Now" atau "Play Now" di halaman detail film.' },
  { q: 'Apakah ada aplikasi mobile?', a: 'Saat ini Cinevora tersedia dalam versi web dan dapat diakses melalui browser di perangkat apapun.' },
  { q: 'Bagaimana kualitas video yang tersedia?', a: 'Kami menyediakan berbagai kualitas tergantung sumbernya, mulai dari HD hingga Full HD, ditandai dengan label kualitas pada setiap film.' },
  { q: 'Apakah filmnya subtitle Indonesia?', a: 'Ya, mayoritas film dilengkapi dengan subtitle Indonesia.' },
]

export default function FAQPage() {
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set())

  function toggleFaq(question: string) {
    setOpenFaqs((current) => {
      const next = new Set(current)
      if (next.has(question)) next.delete(question)
      else next.add(question)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO title="FAQ" description="Pertanyaan yang sering diajukan tentang Cinevora" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-6">
          <IconArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-8">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqs.has(faq.q)
            const answerId = `faq-answer-${index}`

            return (
              <section key={faq.q} className="bg-cinema-900 border border-white/[0.06] rounded-lg">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleFaq(faq.q)}
                  className="w-full px-4 py-3 text-left text-sm font-medium cursor-pointer flex items-center justify-between"
                >
                {faq.q}
                  <span className={`text-white/40 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}>&#9660;</span>
                </button>
                <div
                  id={answerId}
                  aria-hidden={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-3 text-sm text-white/50 leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
