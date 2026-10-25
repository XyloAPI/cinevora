import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  name?: string
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  menuClassName?: string
}

export default function Select({
  name,
  options,
  value,
  defaultValue = '',
  onChange,
  placeholder = 'Select...',
  disabled,
  className,
  menuClassName,
}: SelectProps) {
  const [internal, setInternal] = useState(defaultValue)
  const selected = value !== undefined ? value : internal
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selectedOption = options.find((o) => o.value === selected)

  function openMenu() {
    const index = options.findIndex((o) => o.value === selected)
    setActiveIndex(index >= 0 ? index : 0)
    setOpen(true)
  }

  function commit(next: string) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      {name && <input type="hidden" name={name} value={selected} />}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            if (!open) {
              openMenu()
              return
            }
            const delta = e.key === 'ArrowDown' ? 1 : -1
            setActiveIndex((i) => Math.min(options.length - 1, Math.max(0, i + delta)))
          }
          if (e.key === 'Enter' && open) {
            e.preventDefault()
            commit(options[activeIndex]?.value ?? selected)
          }
        }}
        className={cn(
          'flex items-center justify-between gap-1.5 rounded border border-white/[0.06] bg-cinema-800 text-white outline-none transition-colors focus:border-cinema-red/50 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <IconChevronDown size={12} className={cn('shrink-0 text-white/40 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute left-0 top-full z-50 mt-1 min-w-full w-max max-h-56 overflow-y-auto rounded-md border border-white/[0.08] bg-cinema-800 py-1 shadow-xl shadow-black/40',
            menuClassName
          )}
        >
          {options.map((option, index) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === selected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 whitespace-nowrap px-2.5 py-1.5 text-left text-[12px] transition-colors',
                  index === activeIndex || option.value === selected
                    ? 'bg-white/[0.06] text-white'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {option.label}
                {option.value === selected && <IconCheck size={12} className="shrink-0 text-cinema-red" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
