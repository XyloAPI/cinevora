export interface SubtitleRowInput {
  seasonNo: number
  episodeNo: number
  url: string
  lang: string
  label: string
  kind: string
}

const COLUMNS = 'movie_id, season_no, episode_no, url, lang, label, kind'
const PLACEHOLDER_GROUP = '(?, ?, ?, ?, ?, ?, ?)'

export function buildDeleteSubtitlesSql(): string {
  return 'DELETE FROM episode_subtitles WHERE movie_id = ?'
}

export function buildInsertSubtitlesSql(
  movieId: string,
  rows: SubtitleRowInput[]
): { sql: string; params: any[] } | null {
  if (!rows || rows.length === 0) return null

  const groups = rows.map(() => PLACEHOLDER_GROUP).join(', ')
  const params: any[] = []
  for (const row of rows) {
    params.push(
      movieId,
      row.seasonNo,
      row.episodeNo,
      row.url,
      row.lang,
      row.label,
      row.kind
    )
  }

  const sql = [
    `INSERT INTO episode_subtitles (${COLUMNS})`,
    `VALUES ${groups}`,
    'ON CONFLICT(movie_id, season_no, episode_no) DO UPDATE SET',
    'url = excluded.url, lang = excluded.lang, label = excluded.label, kind = excluded.kind',
  ].join('\n')

  return { sql, params }
}
