import { Link } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO title="Privacy Policy" description="Kebijakan privasi Cinevora" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-6">
          <IconArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-sm text-white/50 leading-relaxed">
          <p>Terakhir diperbarui: 2026</p>
          <h2 className="text-white font-semibold text-base mt-6">1. Informasi yang Kami Kumpulkan</h2>
          <p>Kami tidak mengumpulkan data pribadi pengguna. Kami hanya menyimpan preferensi tontonan secara lokal di perangkat Anda.</p>
          <h2 className="text-white font-semibold text-base mt-6">2. Penggunaan Data</h2>
          <p>Data yang dikumpulkan digunakan semata-mata untuk meningkatkan pengalaman pengguna dan tidak dibagikan kepada pihak ketiga.</p>
          <h2 className="text-white font-semibold text-base mt-6">3. Cookie</h2>
          <p>Kami tidak menggunakan cookie pelacakan. Cookie fungsional digunakan hanya untuk menyimpan preferensi tampilan.</p>
          <h2 className="text-white font-semibold text-base mt-6">4. Perubahan Kebijakan</h2>
          <p>Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan diinformasikan melalui halaman ini.</p>
        </div>
      </div>
    </div>
  )
}
