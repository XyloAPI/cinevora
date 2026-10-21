import { describe, it, expect } from 'vitest'
import { buildDeleteSubtitlesSql, buildInsertSubtitlesSql, type SubtitleRowInput } from '@/lib/subtitleSql'

const ROW_A: SubtitleRowInput = {
  seasonNo: 1,
  episodeNo: 1,
  url: 'https://cdn/a.vtt',
  lang: 'id',
  label: 'Indonesia',
  kind: 'subtitles',
}

const ROW_B: SubtitleRowInput = {
  seasonNo: 1,
  episodeNo: 2,
  url: 'https://cdn/b.vtt',
  lang: 'en',
  label: 'English',
  kind: 'subtitles',
}

describe('buildDeleteSubtitlesSql', () => {
  it('deletes every subtitle of one movie', () => {
    expect(buildDeleteSubtitlesSql()).toBe('DELETE FROM episode_subtitles WHERE movie_id = ?')
  })
})

describe('buildInsertSubtitlesSql', () => {
  it('returns null when there are no rows', () => {
    expect(buildInsertSubtitlesSql('m1', [], '2026-01-01T00:00:00Z')).toBeNull()
  })

  it('binds eight parameters for a single row', () => {
    const built = buildInsertSubtitlesSql('m1', [ROW_A], '2026-01-01T00:00:00Z')
    expect(built).not.toBeNull()
    expect(built!.params).toHaveLength(8)
    expect(built!.params[0]).toBe('m1')
    expect(built!.params[1]).toBe(ROW_A.seasonNo)
    expect(built!.params[2]).toBe(ROW_A.episodeNo)
    expect(built!.params[3]).toBe(ROW_A.url)
    expect(built!.params[4]).toBe(ROW_A.lang)
    expect(built!.params[5]).toBe(ROW_A.label)
    expect(built!.params[6]).toBe(ROW_A.kind)
    expect(built!.params[7]).toBe('2026-01-01T00:00:00Z')
  })

  it('binds sixteen parameters for two rows', () => {
    const built = buildInsertSubtitlesSql('m1', [ROW_A, ROW_B], '2026-01-01T00:00:00Z')
    expect(built!.params).toHaveLength(16)
    expect(built!.params[8]).toBe('m1')
    expect(built!.params[11]).toBe(ROW_B.url)
  })

  it('inserts one values group per row', () => {
    const built = buildInsertSubtitlesSql('m1', [ROW_A, ROW_B], '2026-01-01T00:00:00Z')
    const groups = built!.sql.match(/\(\?, \?, \?, \?, \?, \?, \?, \?\)/g)
    expect(groups).toHaveLength(2)
    expect(built!.sql).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)')
  })

  it('lists every column', () => {
    const built = buildInsertSubtitlesSql('m1', [ROW_A], '2026-01-01T00:00:00Z')
    expect(built!.sql).toContain(
      'INSERT INTO episode_subtitles (movie_id, season_no, episode_no, url, lang, label, kind, updated_at)'
    )
  })

  it('upserts on the primary key so a repeated save is safe', () => {
    const built = buildInsertSubtitlesSql('m1', [ROW_A], '2026-01-01T00:00:00Z')
    expect(built!.sql).toContain('ON CONFLICT(movie_id, season_no, episode_no) DO UPDATE')
    expect(built!.sql).toContain('url = excluded.url')
  })

  it('refreshes updated_at on every save so clients bust their cache', () => {
    const first = buildInsertSubtitlesSql('m1', [ROW_A], '2026-01-01T00:00:00Z')
    const second = buildInsertSubtitlesSql('m1', [ROW_A], '2026-01-02T00:00:00Z')
    expect(first!.params[7]).not.toBe(second!.params[7])
    expect(second!.sql).toContain('updated_at = excluded.updated_at')
  })
})
