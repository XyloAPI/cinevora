// TMDB genre ids are stable, so the English names are kept locally instead of
// relying on the API response language (the detail endpoint is queried with
// `language=id-ID`, which returns Indonesian names).
export const TMDB_GENRE_NAMES: Record<number, string> = {
  // Movie genres
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',

  // TV genres
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  10768: 'War & Politics',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10766: 'Soap',
  10767: 'Talk',
}

export function genreName(id: number): string | null {
  return TMDB_GENRE_NAMES[id] ?? null
}

export function genreNames(ids: number[]): string[] {
  const names: string[] = []
  for (const id of ids) {
    const name = genreName(id)
    if (name) names.push(name)
  }
  return names
}

// Indonesian genre names produced by TMDB when queried with `language=id-ID`.
export const INDONESIAN_GENRE_NAMES: Record<string, string> = {
  'Aksi': 'Action',
  'Aksi & Petualangan': 'Action & Adventure',
  'Animasi': 'Animation',
  'Cerita Fiksi': 'Science Fiction',
  'Cerita Seru': 'Thriller',
  'Dokumenter': 'Documentary',
  'Fantasi': 'Fantasy',
  'Film TV': 'TV Movie',
  'Keluarga': 'Family',
  'Kejahatan': 'Crime',
  'Kengerian': 'Horror',
  'Komedi': 'Comedy',
  'Musik': 'Music',
  'Misteri': 'Mystery',
  'Petualangan': 'Adventure',
  'Percintaan': 'Romance',
  'Sejarah': 'History',
  'Sci-fi & Fantasy': 'Sci-Fi & Fantasy',
}

export function normalizeGenreNames(genres: string[]): string[] {
  const result: string[] = []
  for (const raw of genres) {
    const trimmed = (raw ?? '').trim()
    if (!trimmed) continue
    const english = INDONESIAN_GENRE_NAMES[trimmed] ?? trimmed
    if (!result.includes(english)) result.push(english)
  }
  return result
}
