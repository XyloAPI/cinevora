import { INDONESIAN_GENRE_NAMES } from './tmdbGenres'

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

/**
 * One-shot migration that rewrites Indonesian genre names stored in
 * `movies.genre` (a JSON array) into their English equivalents.
 *
 * It runs as a single UPDATE over every row: `json_each` expands the array,
 * each element is translated through the CASE expression, duplicates created
 * by the translation are removed with DISTINCT, and the result is re-joined
 * with `json_group_array`.
 *
 * The statement is idempotent - running it again matches nothing.
 */
export function buildGenreMigrationSql(): string {
  const entries = Object.entries(INDONESIAN_GENRE_NAMES)
  const cases = entries
    .map(([indonesian, english]) => `WHEN '${escapeSql(indonesian)}' THEN '${escapeSql(english)}'`)
    .join('\n            ')

  const matches = entries
    .map(([indonesian]) => `genre LIKE '%${escapeSql(indonesian)}%'`)
    .join('\n    OR ')

  return `UPDATE movies
SET genre = (
  SELECT json_group_array(value) FROM (
    SELECT DISTINCT CASE value
            ${cases}
            ELSE value END AS value
    FROM json_each(movies.genre)
    WHERE value IS NOT NULL AND TRIM(value) <> ''
  )
)
WHERE genre IS NOT NULL
  AND genre <> '[]'
  AND (
    ${matches}
  )`
}
