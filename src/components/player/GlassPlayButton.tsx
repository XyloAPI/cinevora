import { useId } from 'react'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'

interface GlassPlayButtonProps {
  playing: boolean
  onClick: () => void
  size?: number
  className?: string
}

/**
 * Apple-style "liquid glass" button.
 *
 * The backdrop is *refracted* through the glass using an SVG turbulence +
 * displacement filter, the same trick Apple's Liquid Glass uses: the content
 * behind the button bends and magnifies near the rim instead of just being
 * blurred. Browsers that reject SVG filters in `backdrop-filter` (Firefox,
 * Safari) fall back to the plain blur declaration.
 */
export default function GlassPlayButton({
  playing,
  onClick,
  size = 76,
  className = '',
}: GlassPlayButtonProps) {
  const rawId = useId()
  const filterId = `liquid-glass-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const glassClass = `lg-glass-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const iconSize = Math.round(size * 0.4)

  return (
    <>
      <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <defs>
          <filter
            id={filterId}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.006 0.012"
              numOctaves="2"
              seed="4"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.5" result="soft" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="soft"
              scale="42"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <style>{`
        .${glassClass} {
          backdrop-filter: blur(14px) saturate(180%);
          backdrop-filter: url(#${filterId}) blur(1px) saturate(190%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
        }
      `}</style>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        aria-label={playing ? 'Pause' : 'Play'}
        className={`group relative grid place-items-center rounded-full transition-transform duration-300 ease-out hover:scale-105 active:scale-95 ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Refracted + blurred backdrop */}
        <span
          className={`${glassClass} absolute inset-0 rounded-full bg-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-10px_16px_rgba(255,255,255,0.1),inset_0_0_18px_rgba(255,255,255,0.07),0_12px_36px_rgba(0,0,0,0.45)]`}
        />

        {/* Specular sheen across the glass */}
        <span className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.04)_26%,transparent_52%,rgba(255,255,255,0.09)_100%)]" />

        {/* Bright rim catching the light */}
        <span className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.2)]" />

        {/* Liquid shimmer - a thin ring of light travelling around the rim,
            masked so the refraction in the middle stays visible */}
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-45 transition-opacity duration-200 ease-out group-hover:opacity-100 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.5),rgba(255,255,255,0.03)_38%,rgba(255,255,255,0.34)_68%,rgba(255,255,255,0.5))] [mask-image:radial-gradient(circle,transparent_34%,black_58%,transparent_76%)] animate-[spin_5s_linear_infinite]" />

        <span className="relative text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {playing ? (
            <IconPlayerPauseFilled size={iconSize} />
          ) : (
            <IconPlayerPlayFilled size={iconSize} className="translate-x-[1px]" />
          )}
        </span>
      </button>
    </>
  )
}
