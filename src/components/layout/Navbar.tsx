import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconSearch, IconMenu2, IconX, IconChevronDown } from '@tabler/icons-react'
import { navLinks } from '@/data/movies'
import { useGenres } from '@/hooks/useMovies'

export default function Navbar() {
  const { data: genres = [] } = useGenres()
  const [open, setOpen] = useState(false)
  const [genreOpen, setGenreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const genreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) {
        setGenreOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
      setOpen(false)
    }
  }

  const handleSearchClick = () => {
    if (!searchOpen) {
      setSearchOpen(true)
    } else {
      if (searchQuery.trim()) {
        handleSearchSubmit()
      } else {
        setSearchOpen(false)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cinema-950/95 backdrop-blur-md border-b border-white/[0.04]">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center shrink-0">
            <img src="/Cinevora.avif" alt="Cinevora" className="h-7" />
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.filter((l) => l.label !== 'Genres').map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="px-3 py-1.5 text-[13px] text-white/50 hover:text-white transition-colors rounded hover:bg-white/[0.04]"
              >
                {link.label}
              </Link>
            ))}
            <div ref={genreRef} className="relative">
              <button
                onClick={() => setGenreOpen(!genreOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-white/50 hover:text-white transition-colors rounded hover:bg-white/[0.04]"
              >
                Genre
                <IconChevronDown size={12} className={`transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
              </button>
              {genreOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-cinema-900 border border-white/[0.06] rounded-lg shadow-xl shadow-black/50 overflow-hidden">
                  <div className="p-1.5 max-h-64 overflow-y-auto">
                    {genres.map((g) => (
                      <Link key={g.name} to={g.href} onClick={() => setGenreOpen(false)}
                        className="block px-3 py-1.5 text-[13px] text-white/50 hover:text-white hover:bg-white/[0.04] rounded transition-colors">
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: overlay search */}
          <div className={`md:hidden absolute left-0 right-0 top-0 h-14 bg-cinema-950/95 backdrop-blur-md flex items-center px-4 z-50 transition-all duration-200 ${searchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <IconSearch size={16} className="text-white/30 shrink-0" />
            <input type="text" placeholder="Search movies..." autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full bg-transparent text-white text-[13px] px-3 py-1.5 outline-none placeholder-white/20" />
            <button onClick={() => setSearchOpen(false)} className="text-white/40 hover:text-white p-1">
              <IconX size={16} />
            </button>
          </div>
          {/* Desktop: slide-out search */}
          <div ref={searchRef} className="hidden md:flex items-center">
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? 'w-48' : 'w-0'}`}>
              <input ref={inputRef} type="text" placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full bg-white/10 text-white text-[13px] px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-cinema-red/50 placeholder-white/20" />
            </form>
            <button onClick={handleSearchClick}
              className="flex items-center p-1.5 text-white/40 hover:text-white transition-colors rounded hover:bg-white/[0.04]">
              <IconSearch size={16} />
            </button>
          </div>
          {/* Mobile: search icon + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="flex items-center p-1.5 text-white/40 hover:text-white transition-colors rounded hover:bg-white/[0.04]">
              <IconSearch size={16} />
            </button>
            <button onClick={() => setOpen(!open)} className="text-white/50 hover:text-white p-1">
              {open ? <IconX size={18} /> : <IconMenu2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-cinema-925 border-t border-white/[0.04] px-4 py-4 space-y-0.5">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.href} onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-white/50 hover:text-white rounded hover:bg-white/[0.04]">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
