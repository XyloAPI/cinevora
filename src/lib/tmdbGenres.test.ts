import { describe, it, expect } from 'vitest'
import { genreName, genreNames, TMDB_GENRE_NAMES } from '@/lib/tmdbGenres'

describe('genreName', () => {
  it('maps the TMDB horror genre id to English', () => {
    expect(genreName(27)).toBe('Horror')
  })

  it('maps the TMDB action genre id to English', () => {
    expect(genreName(28)).toBe('Action')
  })

  it('returns null for an unknown id', () => {
    expect(genreName(999999)).toBeNull()
  })

  it('covers every official TMDB movie genre id', () => {
    const movieIds = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37]
    for (const id of movieIds) {
      expect(genreName(id), `movie genre ${id}`).toBeTruthy()
    }
  })

  it('covers every official TMDB tv genre id', () => {
    const tvIds = [10759, 10765, 10768, 10766, 10767, 10764, 10763, 10762, 99, 80, 18, 35, 16, 10751, 9648, 37]
    for (const id of tvIds) {
      expect(genreName(id), `tv genre ${id}`).toBeTruthy()
    }
  })

  it('never returns an Indonesian genre name', () => {
    // 'Drama' is intentionally absent: the word is identical in both languages.
    const indonesian = ['Kengerian', 'Komedi', 'Aksi', 'Petualangan', 'Animasi', 'Fiksi ilmiah', 'Fantasi', 'Romantis']
    for (const name of Object.values(TMDB_GENRE_NAMES)) {
      expect(indonesian).not.toContain(name)
    }
  })
})

describe('genreNames', () => {
  it('maps a list of ids', () => {
    expect(genreNames([27, 35])).toEqual(['Horror', 'Comedy'])
  })

  it('drops unknown ids', () => {
    expect(genreNames([27, 999999, 18])).toEqual(['Horror', 'Drama'])
  })

  it('returns an empty list for no ids', () => {
    expect(genreNames([])).toEqual([])
  })
})
