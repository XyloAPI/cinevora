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
      <div className="flex items-center justify-start sm:justify-start md:justify-center gap-5 sm:gap-6 md:gap-7 overflow-x-auto pt-2 pb-5 px-2 scroll-hidden select-none">
        {platforms.map((p) => {
          const isClickable = !!p.targetRowId
          
          return (
            <button
              key={p.id}
              onClick={() => p.targetRowId && handleScrollToRow(p.targetRowId)}
              disabled={!isClickable}
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 relative z-10 hover:z-30 group shadow-md hover:shadow-xl hover:shadow-black/70 ${
                isClickable 
                  ? 'border-white/[0.08] hover:border-white/30 hover:scale-105 cursor-pointer' 
                  : 'border-white/[0.03] opacity-30 cursor-not-allowed'
              }`}
            >
              <img
                src={`/assets/logos/${p.id}.avif`}
                draggable={false}
                className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105"
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
              <span className="logo-text-fallback hidden w-full h-full bg-cinema-800 flex items-center justify-center text-xs sm:text-sm font-black tracking-widest uppercase opacity-70">
                {p.logoPlaceholderText}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
