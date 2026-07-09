import React from 'react'

interface PlatformItem {
  id: string
  name: string
  color: string
  targetRowId?: string
  logoPlaceholderText: string
}

const platforms: PlatformItem[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    color: 'from-[#E50914]/20 to-[#E50914]/5 border-[#E50914]/30 text-[#E50914]',
    targetRowId: 'netflix-row',
    logoPlaceholderText: 'NETFLIX',
  },
  {
    id: 'disney',
    name: 'Disney+',
    color: 'from-[#0063e5]/20 to-[#30b9e3]/5 border-[#0063e5]/30 text-[#30b9e3]',
    targetRowId: 'disney-row',
    logoPlaceholderText: 'Disney+',
  },
  {
    id: 'viu',
    name: 'Viu',
    color: 'from-[#FFC20E]/20 to-[#FFC20E]/5 border-[#FFC20E]/30 text-[#FFC20E]',
    targetRowId: 'viu-row',
    logoPlaceholderText: 'VIU',
  },
  {
    id: 'prime',
    name: 'Prime Video',
    color: 'from-[#00A8E1]/20 to-[#00A8E1]/5 border-[#00A8E1]/30 text-[#00A8E1]',
    logoPlaceholderText: 'PRIME',
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    color: 'from-[#9933FF]/20 to-[#9933FF]/5 border-[#9933FF]/30 text-[#9933FF]',
    logoPlaceholderText: 'HBO MAX',
  },
  {
    id: 'apple',
    name: 'Apple TV+',
    color: 'from-[#ffffff]/20 to-[#ffffff]/5 border-[#ffffff]/20 text-white',
    logoPlaceholderText: 'Apple TV+',
  },
]

export default function PlatformsRow() {
  function handleScrollToRow(rowId: string) {
    const element = document.getElementById(rowId)
    if (element) {
      const headerOffset = 70
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  return (
    <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 overflow-x-auto pb-3 scroll-hidden select-none">
        {platforms.map((p) => {
          const isClickable = !!p.targetRowId
          
          return (
            <button
              key={p.id}
              onClick={() => p.targetRowId && handleScrollToRow(p.targetRowId)}
              disabled={!isClickable}
              className={`w-28 h-14 sm:w-36 sm:h-18 md:w-44 md:h-22 shrink-0 rounded-xl bg-gradient-to-br bg-cinema-900/40 backdrop-blur border flex items-center justify-center transition-all duration-300 relative group overflow-hidden ${
                isClickable 
                  ? `${p.color} hover:scale-105 active:scale-95 cursor-pointer shadow-lg hover:shadow-black/45` 
                  : 'border-white/[0.04] text-white/20 cursor-not-allowed opacity-60'
              }`}
            >
              {/* Radial glow on hover */}
              {isClickable && (
                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}

              {/* Logo Image */}
              <div className="flex flex-col items-center justify-center p-2">
                <img
                  src={`/assets/logos/${p.id}.avif`}
                  className={`h-5 sm:h-6 md:h-7 object-contain transition-all duration-300 ${
                    isClickable ? 'opacity-85 group-hover:opacity-100 group-hover:scale-105' : 'opacity-30'
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

                <span className="logo-text-fallback hidden text-[12px] sm:text-sm md:text-base font-black tracking-widest uppercase opacity-80">
                  {p.logoPlaceholderText}
                </span>
                
                {isClickable && (
                  <span className="text-[8px] opacity-35 mt-1.5 group-hover:opacity-75 transition-opacity font-semibold tracking-wider uppercase text-white/90">
                    Browse
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
