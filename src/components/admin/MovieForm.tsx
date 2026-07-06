import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { IconLanguage } from '@tabler/icons-react'
import { addMovie, updateMovie } from '@/lib/db'
import { translateToId } from '@/lib/translate'
import { slugify } from '@/lib/utils'
import type { Movie } from '@/types'

interface MovieFormProps {
  editingMovie: Partial<Movie>
  localMovies: Movie[]
  closeForm: () => void
  refetch: () => void
}

export default function MovieForm({
  editingMovie,
  localMovies,
  closeForm,
  refetch,
}: MovieFormProps) {
  const [synopsisText, setSynopsisText] = useState('')
  const [taglineText, setTaglineText] = useState('')
  const [translatingSynopsis, setTranslatingSynopsis] = useState(false)
  const [synopsisTranslated, setSynopsisTranslated] = useState(false)
  const [translatingTagline, setTranslatingTagline] = useState(false)
  const [taglineTranslated, setTaglineTranslated] = useState(false)
  const [saving, setSaving] = useState(false)

  const originalSynopsisRef = useRef('')
  const originalTaglineRef = useRef('')

  useEffect(() => {
    setSynopsisText(editingMovie.synopsis || '')
    setTaglineText(editingMovie.tagline || '')
    setSynopsisTranslated(false)
    setTaglineTranslated(false)
    originalSynopsisRef.current = editingMovie.synopsis || ''
    originalTaglineRef.current = editingMovie.tagline || ''
  }, [editingMovie])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const isEdit = localMovies.some((m) => m.id === editingMovie.id)
    const genreRaw = (form.get('genre') as string || '').split(',').map((g) => g.trim()).filter(Boolean)
    const castRaw = (form.get('cast') as string || '').split(',').map((c) => c.trim()).filter(Boolean)
    const prodRaw = (form.get('productionCompanies') as string || '').split(',').map((c) => c.trim()).filter(Boolean)

    const title = (form.get('title') as string) || ''
    const data = {
      slug: slugify(title),
      title,
      year: Number(form.get('year')),
      rating: Number(form.get('rating')),
      genre: JSON.stringify(genreRaw),
      poster: (form.get('poster') as string) || '',
      backdrop: (form.get('backdrop') as string) || '',
      synopsis: synopsisText || '',
      is_trending: form.get('isTrending') === 'on' ? 1 : 0,
      is_featured: form.get('isFeatured') === 'on' ? 1 : 0,
      coming_soon: form.get('comingSoon') === 'on' ? 1 : 0,
      release_date: (form.get('releaseDate') as string) || null,
      quality: (form.get('quality') as string) || null,
      duration: (form.get('duration') as string) || null,
      type: (form.get('type') as string) || 'movie',
      episodes: null,
      seasons: null,
      tmdb_id: Number(form.get('tmdbId')) || null,
      imdb_id: (form.get('imdbId') as string) || null,
      tagline: taglineText || null,
      runtime: Number(form.get('runtime')) || null,
      budget: Number(form.get('budget')) || null,
      revenue: Number(form.get('revenue')) || null,
      original_language: (form.get('originalLanguage') as string) || null,
      popularity: Number(form.get('popularity')) || null,
      vote_count: Number(form.get('voteCount')) || null,
      homepage: (form.get('homepage') as string) || null,
      director: (form.get('director') as string) || null,
      cast: castRaw.length ? JSON.stringify(castRaw) : null,
      logo_url: (form.get('logoUrl') as string) || null,
      trailer_url: (form.get('trailerUrl') as string) || null,
      stream_url: (form.get('streamUrl') as string) || null,
      production_companies: prodRaw.length ? JSON.stringify(prodRaw) : null,
      status: (form.get('status') as string) || null,
    }

    try {
      if (isEdit) {
        await updateMovie(editingMovie.id!, data)
        toast.success('Movie updated')
      } else {
        await addMovie({ id: String(Date.now()), ...data })
        toast.success('Movie added')
      }
      closeForm()
      refetch()
    } catch {
      toast.error(isEdit ? 'Failed to update movie' : 'Failed to add movie')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{localMovies.some((m) => m.id === editingMovie.id) ? 'Edit Movie' : 'Add Movie'}</h3>
        {editingMovie.poster && (
          <img src={editingMovie.poster} alt="" className="h-10 rounded object-cover" />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Title *<input name="title" defaultValue={editingMovie.title} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50 mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Year *<input name="year" type="number" defaultValue={editingMovie.year} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Rating *<input name="rating" type="number" step="0.1" defaultValue={editingMovie.rating} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Genre *<input name="genre" defaultValue={editingMovie.genre?.join(', ')} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Poster URL *<input name="poster" defaultValue={editingMovie.poster} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Backdrop URL *<input name="backdrop" defaultValue={editingMovie.backdrop} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        
        <div className="flex flex-col gap-1 sm:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Synopsis *</span>
            <button type="button" disabled={translatingSynopsis} onClick={async () => {
              if (translatingSynopsis) return
              if (synopsisTranslated) {
                setSynopsisText(originalSynopsisRef.current)
                setSynopsisTranslated(false)
                return
              }
              const text = synopsisText
              if (!text.trim()) return
              originalSynopsisRef.current = text
              setTranslatingSynopsis(true)
              try {
                const t = await translateToId(text)
                setSynopsisText(t)
                setSynopsisTranslated(true)
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Translate failed')
              } finally {
                setTranslatingSynopsis(false)
              }
            }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors uppercase tracking-wider disabled:opacity-50 ${translatingSynopsis ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : synopsisTranslated ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-cinema-red/20 text-cinema-red hover:bg-cinema-red/30'}`}>
              {translatingSynopsis ? <><span className="inline-block w-2 h-2 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> ID</> : synopsisTranslated ? <><IconLanguage size={11} /> Asli</> : <><IconLanguage size={11} /> ID</>}
            </button>
          </div>
          <textarea name="synopsis" value={synopsisText} onChange={(e) => setSynopsisText(e.target.value)} required className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none resize-none h-16 mt-0.5" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Tagline</span>
            <button type="button" disabled={translatingTagline} onClick={async () => {
              if (translatingTagline) return
              if (taglineTranslated) {
                setTaglineText(originalTaglineRef.current)
                setTaglineTranslated(false)
                return
              }
              const text = taglineText
              if (!text.trim()) return
              originalTaglineRef.current = text
              setTranslatingTagline(true)
              try {
                const t = await translateToId(text)
                setTaglineText(t)
                setTaglineTranslated(true)
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Translate failed')
              } finally {
                setTranslatingTagline(false)
              }
            }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors uppercase tracking-wider disabled:opacity-50 ${translatingTagline ? 'bg-yellow-500/20 text-yellow-400 animate-pulse' : taglineTranslated ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-cinema-red/20 text-cinema-red hover:bg-cinema-red/30'}`}>
              {translatingTagline ? <><span className="inline-block w-2 h-2 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /> ID</> : taglineTranslated ? <><IconLanguage size={11} /> Asli</> : <><IconLanguage size={11} /> ID</>}
            </button>
          </div>
          <input name="tagline" value={taglineText} onChange={(e) => setTaglineText(e.target.value)} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" />
        </div>

        <label className="flex flex-col gap-1 text-[11px] text-white/40">Release Date<input name="releaseDate" type="date" defaultValue={editingMovie.releaseDate || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Duration<input name="duration" defaultValue={editingMovie.duration || ''} placeholder="e.g. 2h 28m" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Runtime (min)<input name="runtime" type="number" defaultValue={editingMovie.runtime ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Quality<input name="quality" defaultValue={editingMovie.quality || ''} placeholder="e.g. WEB-DL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Director<input name="director" defaultValue={editingMovie.director || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Cast<input name="cast" defaultValue={editingMovie.cast?.join(', ') || ''} placeholder="comma separated" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Logo URL<input name="logoUrl" defaultValue={editingMovie.logoUrl || ''} placeholder="TMDB logo URL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Trailer URL<input name="trailerUrl" defaultValue={editingMovie.trailerUrl || ''} placeholder="YouTube URL" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Stream URL<input name="streamUrl" defaultValue={editingMovie.streamUrl || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Homepage<input name="homepage" defaultValue={editingMovie.homepage || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Original Lang.<input name="originalLanguage" defaultValue={editingMovie.originalLanguage || ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Production Co.<input name="productionCompanies" defaultValue={editingMovie.productionCompanies?.join(', ') || ''} placeholder="comma separated" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Status<input name="status" defaultValue={editingMovie.status || ''} placeholder="e.g. Released" className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Budget<input name="budget" type="number" defaultValue={editingMovie.budget ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Revenue<input name="revenue" type="number" defaultValue={editingMovie.revenue ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">TMDB ID<input name="tmdbId" type="number" defaultValue={editingMovie.tmdbId ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">IMDB ID<input name="imdbId" defaultValue={editingMovie.imdbId || ''} placeholder="tt..." className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Popularity<input name="popularity" type="number" step="0.1" defaultValue={editingMovie.popularity ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Vote Count<input name="voteCount" type="number" defaultValue={editingMovie.voteCount ?? ''} className="bg-cinema-800 text-white text-[12px] px-2.5 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5" /></label>
        
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 text-[11px] text-white/40">
            <input name="isTrending" type="checkbox" defaultChecked={editingMovie.isTrending} className="accent-cinema-red" /> Trending
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-white/40">
            <input name="isFeatured" type="checkbox" defaultChecked={editingMovie.isFeatured} className="accent-cinema-red" /> Featured
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-white/40">
            <input name="comingSoon" type="checkbox" defaultChecked={editingMovie.comingSoon} className="accent-cinema-red" /> Coming Soon
          </label>
        </div>
        
        <label className="flex flex-col gap-1 text-[11px] text-white/40">Type<select name="type" defaultValue={editingMovie.type || 'movie'} className="bg-cinema-800 text-white text-[12px] px-2 py-1.5 rounded border border-white/[0.06] outline-none mt-0.5">
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select></label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={closeForm} className="px-3 py-1.5 text-[12px] text-white/40 hover:text-white">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-1.5 bg-cinema-red text-white text-[12px] font-medium rounded hover:bg-cinema-red-dark disabled:opacity-50">
          {saving ? 'Saving...' : localMovies.some((m) => m.id === editingMovie.id) ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  )
}
