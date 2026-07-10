import React from 'react'

interface PlatformItem {
  id: string
  name: string
  targetRowId?: string
  logoPlaceholderText: string
  glowColor: string
}

const platforms: PlatformItem[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    targetRowId: 'netflix-row',
    logoPlaceholderText: 'N',
    glowColor: 'from-[#E50914]/25 via-[#E50914]/5 to-transparent',
  },
  {
    id: 'disney',
    name: 'Disney+',
    targetRowId: 'disney-row',
    logoPlaceholderText: 'D+',
    glowColor: 'from-[#0063e5]/30 via-[#30b9e3]/5 to-transparent',
  },
  {
    id: 'viu',
    name: 'Viu',
    targetRowId: 'viu-row',
    logoPlaceholderText: 'Viu',
    glowColor: 'from-[#FFC20E]/20 via-[#FFC20E]/5 to-transparent',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    targetRowId: 'prime-row',
    logoPlaceholderText: 'PV',
    glowColor: 'from-[#00A8E1]/20 via-[#00A8E1]/5 to-transparent',
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    targetRowId: 'hbo-row',
    logoPlaceholderText: 'HBO',
    glowColor: 'from-[#9933FF]/20 via-[#9933FF]/5 to-transparent',
  },
  {
    id: 'apple',
    name: 'Apple TV+',
    targetRowId: 'apple-row',
    logoPlaceholderText: 'Apple',
    glowColor: 'from-white/15 via-white/5 to-transparent',
  },
]

export default function PlatformsRow() {
  function handleScrollToRow(rowId: string) {
    const element = document.getElementById(rowId)
    if (element) {
      const headerOffset = 90
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 relative z-20">
      {/* Title */}
      <div className="mb-4">
        <h2 className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-white/30 uppercase">
          Pilih Platform
        </h2>
      </div>

      {/* Grid/Row of platform icons */}
      <div className="flex items-center justify-start sm:justify-start md:justify-center gap-4 overflow-x-auto pt-3 pb-5 px-2 scroll-hidden select-none">
        {platforms.map((p) => {
          const isClickable = !!p.targetRowId
          
          return (
            <button
              key={p.id}
              onClick={() => p.targetRowId && handleScrollToRow(p.targetRowId)}
              disabled={!isClickable}
              className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 shrink-0 rounded-2xl bg-gradient-to-b from-[#18191e]/90 to-[#0e0f12]/95 border flex items-center justify-center transition-all duration-300 relative z-10 hover:z-30 group overflow-hidden ${
                isClickable 
                  ? 'border-white/[0.08] hover:border-white/30 hover:scale-105 cursor-pointer shadow-lg hover:shadow-black/80' 
                  : 'border-white/[0.03] opacity-25 cursor-not-allowed'
              }`}
            >
              {/* Radial glow background on hover */}
              {isClickable && (
                <div className={`absolute inset-0 bg-gradient-to-b ${p.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              )}
              
              {/* Subtle top border highlight */}
              {isClickable && (
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Logo Container */}
              <div className="w-full h-full flex items-center justify-center p-3 relative z-10">
                <img
                  src={`/assets/logos/${p.id}.avif`}
                  className={`w-[85%] h-[85%] object-contain transition-all duration-500 ${
                    isClickable 
                      ? 'opacity-85 group-hover:opacity-100 group-hover:scale-110' 
                      : 'opacity-40 grayscale'
                  }`}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      const fallback = parent.querySelector('.logo-text-fallback')
                      if (fallback) fallback.classList.remove('hidden')
                    }
                  }}
                />

                {/* Text Fallback */}
                <span className="logo-text-fallback hidden text-xs sm:text-sm font-black tracking-widest uppercase opacity-70">
                  {p.logoPlaceholderText}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
