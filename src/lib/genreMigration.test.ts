import { describe, it, expect } from 'vitest'
import { normalizeGenreNames } from '@/lib/tmdbGenres'
import { buildGenreMigrationSql } from '@/lib/genreMigration'

describe('normalizeGenreNames', () => {
  it('translates an Indonesian genre to English', () => {
    expect(normalizeGenreNames(['Kengerian'])).toEqual(['Horror'])
  })

  it('keeps English genres untouched', () => {
    expect(normalizeGenreNames(['Drama', 'Thriller'])).toEqual(['Drama', 'Thriller'])
  })

  it('translates multi-word Indonesian genres', () => {
    expect(normalizeGenreNames(['Aksi & Petualangan'])).toEqual(['Action & Adventure'])
  })

  it('removes duplicates created by the translation', () => {
    expect(normalizeGenreNames(['Aksi', 'Action'])).toEqual(['Action'])
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeGenreNames(['  Komedi  '])).toEqual(['Comedy'])
  })

  it('drops empty entries', () => {
    expect(normalizeGenreNames(['Komedi', '', '   '])).toEqual(['Comedy'])
  })

  it('returns an empty list for no genres', () => {
    expect(normalizeGenreNames([])).toEqual([])
  })
})

describe('buildGenreMigrationSql', () => {
  const sql = buildGenreMigrationSql()

  it('rewrites every movie row that has a genre', () => {
    expect(sql).toContain('UPDATE movies')
    expect(sql).toContain('json_each(movies.genre)')
  })

  it('matches rows containing any Indonesian genre name', () => {
    expect(sql).toContain("genre LIKE '%Aksi%'")
    expect(sql).toContain("genre LIKE '%Komedi%'")
    expect(sql).toContain("genre LIKE '%Kengerian%'")
    expect(sql).toContain("genre LIKE '%Dokumenter%'")
  })

  it('maps the Indonesian genre names to English', () => {
    expect(sql).toContain("WHEN 'Aksi' THEN 'Action'")
    expect(sql).toContain("WHEN 'Komedi' THEN 'Comedy'")
    expect(sql).toContain("WHEN 'Kengerian' THEN 'Horror'")
    expect(sql).toContain("WHEN 'Petualangan' THEN 'Adventure'")
    expect(sql).toContain("WHEN 'Cerita Seru' THEN 'Thriller'")
    expect(sql).toContain("WHEN 'Cerita Fiksi' THEN 'Science Fiction'")
    expect(sql).toContain("WHEN 'Keluarga' THEN 'Family'")
    expect(sql).toContain("WHEN 'Kejahatan' THEN 'Crime'")
    expect(sql).toContain("WHEN 'Animasi' THEN 'Animation'")
    expect(sql).toContain("WHEN 'Fantasi' THEN 'Fantasy'")
    expect(sql).toContain("WHEN 'Percintaan' THEN 'Romance'")
    expect(sql).toContain("WHEN 'Misteri' THEN 'Mystery'")
    expect(sql).toContain("WHEN 'Dokumenter' THEN 'Documentary'")
    expect(sql).toContain("WHEN 'Sejarah' THEN 'History'")
    expect(sql).toContain("WHEN 'Musik' THEN 'Music'")
    expect(sql).toContain("WHEN 'Film TV' THEN 'TV Movie'")
    expect(sql).toContain("WHEN 'Aksi & Petualangan' THEN 'Action & Adventure'")
  })

  it('deduplicates the translated genres', () => {
    expect(sql).toContain('DISTINCT')
    expect(sql).toContain('json_group_array')
  })
})

