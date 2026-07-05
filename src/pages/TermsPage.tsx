import { Link } from 'react-router-dom'
import { IconArrowLeft } from '@tabler/icons-react'
import SEO from '@/components/shared/SEO'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cinema-950 text-white pt-14">
      <SEO title="Terms of Service" description="Syarat dan ketentuan penggunaan Cinevora" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white transition-colors mb-6">
          <IconArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
        <div className="space-y-4 text-sm text-white/50 leading-relaxed">
          <p>Terakhir diperbarui: 2026</p>
          <h2 className="text-white font-semibold text-base mt-6">1. Penerimaan Ketentuan</h2>
          <p>Dengan menggunakan Cinevora, Anda menyetujui syarat dan ketentuan yang tercantum di halaman ini.</p>
          <h2 className="text-white font-semibold text-base mt-6">2. Penggunaan Layanan</h2>
          <p>Cinevora menyediakan layanan streaming informasi film. Kami tidak menyimpan file video di server kami.</p>
          <h2 className="text-white font-semibold text-base mt-6">3. Hak Kekayaan Intelektual</h2>
          <p>Semua konten yang ditampilkan adalah milik pemiliknya masing-masing. Cinevora hanya bertindak sebagai agregator informasi.</p>
          <h2 className="text-white font-semibold text-base mt-6">4. Batasan Tanggung Jawab</h2>
          <p>Cinevora tidak bertanggung jawab atas konten eksternal yang ditautkan dari situs kami.</p>
          <h2 className="text-white font-semibold text-base mt-6">5. Perubahan Ketentuan</h2>
          <p>Kami berhak mengubah ketentuan ini sewaktu-waktu. Penggunaan lanjutan setelah perubahan berarti persetujuan Anda.</p>
        </div>
      </div>
    </div>
  )
}
