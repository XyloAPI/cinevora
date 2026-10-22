import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'

interface GlassPlayButtonProps {
  playing: boolean
  onClick: () => void
  size?: number
  className?: string
}

export default function GlassPlayButton({
  playing,
  onClick,
  size = 76,
  className = '',
}: GlassPlayButtonProps) {
  const iconSize = Math.round(size * 0.42)

  return (
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
      {/* Liquid highlight - slowly rotating conic gradient */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-[3px] transition-opacity duration-500 group-hover:opacity-100 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,255,255,0.55),rgba(255,255,255,0.05)_35%,rgba(255,255,255,0.4)_65%,rgba(255,255,255,0.55))] animate-[spin_7s_linear_infinite]"
      />

      {/* Glass body */}
      <span className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),inset_0_-12px_20px_rgba(255,255,255,0.12),0_10px_30px_rgba(0,0,0,0.45)]" />

      {/* Rim highlight */}
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />

      {/* Icon */}
      <span className="relative text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
        {playing ? (
          <IconPlayerPauseFilled size={iconSize} />
        ) : (
          <IconPlayerPlayFilled size={iconSize} className="translate-x-[1px]" />
        )}
      </span>
    </button>
  )
}
