# Custom Player (Vidstack) + Self-Managed Subtitles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti `<iframe>` embed pihak ketiga dengan custom player Vidstack yang memutar file video dari CDN sendiri, dan tambahkan subtitle self-managed (URL `.vtt`/`.srt` per episode, diinput admin).

**Architecture:** Layer frontend murni untuk video — URL file disimpan apa adanya di kolom yang sudah ada (`movies.stream_url`, `movies.stream_url_2`, dan `url`/`url2` di dalam JSON episode). Player baru (`src/components/player/VideoPlayer.tsx`) membungkus Vidstack `<MediaPlayer>`. Subtitle disimpan di tabel baru `episode_subtitles` dengan composite key `(movie_id, season_no, episode_no)`, dibaca lewat proxy `/api/subtitle` (menghindari masalah CORS text-track) dan diunduh lewat proxy `/api/stream/download` (menghasilkan `Content-Disposition: attachment`).

**Tech Stack:** React 18, Vite 6, TypeScript, `@vidstack/react@1.15.7`, Turso/libSQL (SQL mentah via `POST /api/db/query`), Express (`server.ts`), Cloudflare Pages Functions (`functions/`), Tailwind CSS, Vitest (baru).

**Spec:** `docs/superpowers/specs/2026-10-21-custom-player-subtitles-design.md`

## Global Constraints

- Node 20, npm. Package manager: npm.
- Vidstack **v1.15.7** persis. CSS di-import sebagai:
  - `import '@vidstack/react/player/styles/default/theme.css'`
  - `import '@vidstack/react/player/styles/default/layouts/video.css'`
- Tema aplikasi: palet `cinema` (`950 #0F0F0F`, `900 #1A1A1A`, `red DEFAULT #E50914`).
- **Tidak ada** embed host pihak ketiga lagi. Larangan keras: string `streamxylospace`, `player.abyssplayer`, `abyss.to`, `byse` tidak boleh muncul di kode.
- **Tidak ada** ffmpeg, tidak ada upload file, tidak ada HLS packaging.
- `src/lib/streamUrls.ts` **tidak boleh** meng-import apa pun dari `import.meta.env` / `process.env` — file ini di-import oleh client, `server.ts`, dan Cloudflare Functions.
- Admin menginput URL **apa adanya**. Satu-satunya transformasi: `trim()` + prepend `https://` bila scheme kosong.
- Subtitle: **1 per episode**. Film memakai `season_no = 0, episode_no = 0`.
- Client **tidak pernah** mengirim URL file ke backend sebagai query parameter (anti-SSRF). Backend resolve URL dari database.
- Bahasa & pesan UI: Indonesia (kode yang Comments/identifiers: English, mengikuti konvensi repo).
- Komentar di kode **tidak boleh** ditulis kecuali diminta.

## Review Focus

Lima kelas input/kegagalan yang paling mungkin menggigit — masing-masing harus punya test di task yang memiliki kodenya:

1. **Episode JSON tanpa season/episode yang diminta** (mis. user pilih Episode 7 padahal season cuma punya 3 episode) → harus return `null`, **bukan** jatuh ke `movies.stream_url` mentah dan **bukan** crash.
2. **`stream_url` berupa URL biasa (film) tetapi client menanyakan `season=3, episode=7`** → harus return URL biasa itu, bukan `null`. Penentuan "film vs series" berasal dari bentuk data, bukan dari parameter.
3. **Slot 2 kosong sementara slot 1 terisi** → player harus tetap memutar slot 1 (fallback), tidak menjadi blank.
4. **URL subtitle dengan query string / huruf besar** (`Sub.ID.SRT?token=abc`) → deteksi tipe subtitle harus tahan, dan `movieId` harus ter-URL-encode di query string.
5. **`localStorage` tidak tersedia** (private mode / browser yang memblokir) → player harus tetap jalan, tidak crash saat menyimpan/membaca posisi playback.

---

## File Structure

| File | Tanggung jawab (satu hal saja) |
|---|---|
| `src/lib/streamUrls.ts` | Logika pure bersama: normalisasi URL, resolusi episode→URL, deteksi tipe subtitle, sanitasi nama file. Dipakai client + server + functions. |
| `src/lib/streamUrls.test.ts` | Test untuk `streamUrls.ts` |
| `src/lib/streamEndpoints.ts` | Builders URL endpoint proxy di sisi client (butuh `VITE_API_BASE_URL`) |
| `src/lib/subtitleSql.ts` | Builders SQL untuk tulis/baca `episode_subtitles` (pure, tanpa network) |
| `src/lib/subtitleSql.test.ts` | Test untuk `subtitleSql.ts` |
| `src/lib/playbackPosition.ts` | Simpan/baca posisi playback di `localStorage` |
| `src/lib/playbackPosition.test.ts` | Test untuk `playbackPosition.ts` |
| `src/components/player/VideoPlayer.tsx` | Wrapper Vidstack: render player + track subtitle, kelola posisi playback |
| `src/components/player/index.ts` | Re-export `VideoPlayer` |
| `functions/api/stream/download.ts` | Proxy download (Cloudflare Pages Functions) |
| `functions/api/subtitle.ts` | Proxy subtitle (Cloudflare Pages Functions) |
| `vitest.config.ts` | Konfigurasi Vitest |

Pola yang dipakai: `server.ts` dan `functions/api/*` **sudah** merupakan implementasi paralel di repo ini (lihat `functions/api/db/query.ts` vs `server.ts:154-168`). Perubahan baru harus uphold pola itu, bukan membuat abstraksi baru.

---

## Task 1: Test harness + shared pure logic (`streamUrls.ts`)

**Files:**
- Create: `package.json` (modify), `vitest.config.ts` (create), `src/lib/streamUrls.ts` (create), `src/lib/streamUrls.test.ts` (create)

**Interfaces:**
- Consumes: tidak ada (task pertama)
- Produces:
  ```ts
  export function normalizeDirectUrl(input: string): string
  export function resolveEpisodeSource(params: {
    streamUrl?: string | null
    streamUrl2?: string | null
    season: number
    episode: number
    slot: 1 | 2
  }): string | null
  export function resolveActiveSource(params: {
    primary: string | null
    mirror: string | null
    preferMirror: boolean
  }): string | null
  export function detectSubtitleType(url: string): 'vtt' | 'srt'
  export function sanitizeFilename(name: string): string
  export function parseEpisodesTree(raw: string | null | undefined): Array<{
    season: number
    episodes: Array<{ episode: number; url: string; url2?: string; sub?: string }>
  }>
  ```

- [ ] **Step 1: Install Vitest dan tambahkan script test**

```bash
npm i -D vitest@^3 @vitest/coverage-v8@^3
```

Tambahkan ke `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Buat `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] },
})
```

- [ ] **Step 3: Tulis test yang gagal — `src/lib/streamUrls.test.ts`**

Test yang harus ada (nama test + assertion utama):

- `normalizeDirectUrl`
  - `''` → `''`
  - `'  https://cdn.x.com/a.mp4  '` → `'https://cdn.x.com/a.mp4'` (trim)
  - `'cdn.x.com/a.mp4'` → `'https://cdn.x.com/a.mp4'` (prepend `https://` bila scheme kosong)
  - `'http://cdn.x.com/a.mp4'` → tetap `'http://cdn.x.com/a.mp4'` (scheme ada, jangan diubah)
  - `'//cdn.x.com/a.mp4'` → `'https://cdn.x.com/a.mp4'` (protocol-relative)
  - `'data:text/plain,x'` → tetap apa adanya (bukan http/https, jangan diubah)
- `parseEpisodesTree`
  - `null` → `[]`
  - `''` → `[]`
  - `'not json'` → `[]` (tidak throw)
  - `'{"a":1}'` → `[]` (bukan array)
  - `'[{"season":1,"episodes":[{"episode":1,"url":"u"}]}]'` → 1 season, 1 episode, `url === 'u'`
- `resolveEpisodeSource`
  - film (bukan JSON): `streamUrl='https://cdn/a.mp4'`, season 0 episode 0 slot 1 → `'https://cdn/a.mp4'`
  - film + `streamUrl2='https://cdn/b.mp4'`, slot 2 → `'https://cdn/b.mp4'`
  - film, slot 2 tapi `streamUrl2` null → `null`
  - film + `streamUrl=''` → `null`
  - series JSON, season 1 episode 2, slot 1 → URL episode 2
  - series JSON, season 1 episode 2, slot 2 → `url2` episode 2
  - series JSON, **season 3 episode 7 tidak ada** → `null` (bukan `streamUrl` mentah) ← Review Focus #1
  - **film dengan season=3 episode=7** → tetap return URL film ← Review Focus #2
  - episode tanpa `url2`, slot 2 → `null`
- `resolveActiveSource`
  - `primary='a'`, `mirror=null`, `preferMirror=false` → `'a'`
  - `primary='a'`, `mirror=null`, `preferMirror=true` → `'a'` ← Review Focus #3 (fallback ke slot 1)
  - `primary=null`, `mirror='b'`, `preferMirror=true` → `'b'`
  - `primary=null`, `mirror=null` → `null`
  - `primary='a'`, `mirror='b'`, `preferMirror=true` → `'b'`
  - string kosong `''` diperlakukan sebagai `null`
- `detectSubtitleType`
  - `'https://x/a.vtt'` → `'vtt'`
  - `'https://x/a.srt'` → `'srt'`
  - `'https://x/a.SRT'` → `'srt'` (huruf besar)
  - `'https://x/a.srt?token=abc'` → `'srt'` (query string diabaikan)
  - `'https://x/a'` → `'vtt'` (default)
- `sanitizeFilename`
  - `'Dune: Part Two'` → `'Dune Part Two'` (karakter ilegal filename dibuang)
  - `'a/b\\c'` → tidak mengandung `/` atau `\`
  - hasil tidak kosong untuk input non-kosong

- [ ] **Step 4: Jalankan test untuk memastikan gagal**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/streamUrls'"

- [ ] **Step 5: Implementasikan `src/lib/streamUrls.ts`**

Catatan implementasi (body tidak ditulis di plan ini):
- `normalizeDirectUrl`: trim; bila kosong → `''`; bila mulai dengan `//` → `'https:' + input`; bila `input` punya scheme (`/^[a-z][a-z0-9+.-]*:/i`) → return apa adanya; bila scheme-nya `http:`/`https:` → return apa adanya; selain itu → `'https://' + input`.
- `parseEpisodesTree`: JSON.parse di-try/catch; hasilnya harus array, setiap elemen harus punya `season` (number) dan `episodes` (array) → selain itu `[]`.
- `resolveEpisodeSource`: bila `streamUrl` di-trim mulai dengan `'['` → parse tree → cari `season === params.season` → di dalamnya cari `episode === params.episode` → return `slot === 1 ? ep.url : ep.url2` (di-trim; string kosong → `null`). Bila tree tidak mengandung season/episode itu → `null`. Bila `streamUrl` **bukan** JSON → perlakukan sebagai film: `slot === 1 ? streamUrl : streamUrl2`, di-trim, string kosong → `null`.
- `resolveActiveSource`: `primary`/`mirror` dinormalisasi (string kosong → `null`). Bila `preferMirror` → return `mirror || primary || null`; selain itu → `primary || mirror || null`.
- `detectSubtitleType`: ambil path dari URL (tanpa query/hash) → lowercase → akhiri `.srt` → `'srt'`, selain itu `'vtt'`.
- `sanitizeFilename`: buang karakter `< > : " / \ | ? *` dan karakter kontrol, ganti spasi berlebih jadi satu spasi, trim, truncate 120 karakter, fallback `'video'` bila kosong.

- [ ] **Step 6: Jalankan test untuk memastikan lulus**

Run: `npm test`
Expected: PASS — semua test di `src/lib/streamUrls.test.ts` hijau.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/streamUrls.ts src/lib/streamUrls.test.ts
git commit -m "feat: add shared stream URL helpers and vitest harness"
```

---

## Task 2: Subtitle SQL builders + database layer

**Files:**
- Create: `src/lib/subtitleSql.ts`, `src/lib/subtitleSql.test.ts`
- Modify: `src/lib/db.ts`

**Interfaces:**
- Consumes: `dbQuery` (private di `src/lib/db.ts`)
- Produces (dari `src/lib/subtitleSql.ts`):
  ```ts
  export interface SubtitleRowInput {
    seasonNo: number
    episodeNo: number
    url: string
    lang: string
    label: string
    kind: string
  }
  export function buildDeleteSubtitlesSql(): string
  export function buildInsertSubtitlesSql(movieId: string, rows: SubtitleRowInput[]): { sql: string; params: any[] } | null
  ```
- Produces (dari `src/lib/db.ts`):
  ```ts
  export interface DbEpisodeSubtitle {
    movie_id: string
    season_no: number
    episode_no: number
    url: string
    lang: string
    label: string
    kind: string
  }
  export async function fetchSubtitles(movieId: string): Promise<DbEpisodeSubtitle[]>
  export async function saveSubtitles(movieId: string, rows: SubtitleRowInput[]): Promise<void>
  ```
  plus DDL `episode_subtitles` ditambahkan di dalam `runMigration()`.

- [ ] **Step 1: Tulis test yang gagal — `src/lib/subtitleSql.test.ts`**

- `buildDeleteSubtitlesSql` → persis `'DELETE FROM episode_subtitles WHERE movie_id = ?'`
- `buildInsertSubtitlesSql('m1', [])` → `null` (tidak perlu INSERT)
- `buildInsertSubtitlesSql('m1', [row1, row2])` → `params.length === 14` (7 kolom x 2 row) dan `sql` mengandung dua grup `VALUES (?, ?, ?, ?, ?, ?, ?)`
- `buildInsertSubtitlesSql('m1', [row])` → `params.length === 7` dengan urutan: `params[0] === 'm1'`, `params[1] === row.seasonNo`, `params[2] === row.episodeNo`, `params[3] === row.url`, `params[4] === row.lang`, `params[5] === row.label`, `params[6] === row.kind`
- `buildInsertSubtitlesSql` menghasilkan `ON CONFLICT(movie_id, season_no, episode_no) DO UPDATE` agar aman kalau dijalankan dua kali
- `sql` mengandung nama kolom `movie_id, season_no, episode_no, url, lang, label, kind`

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/subtitleSql'"

- [ ] **Step 3: Implementasikan `src/lib/subtitleSql.ts`**

- `buildDeleteSubtitlesSql()` → string konstan di atas.
- `buildInsertSubtitlesSql(movieId: string, rows: SubtitleRowInput[]): { sql: string; params: any[] } | null`:
  - `rows.length === 0` → `null`
  - 7 kolom: `movie_id, season_no, episode_no, url, lang, label, kind`; grup VALUES berisi **7** placeholder (`?, ?, ?, ?, ?, ?, ?`)
  - `sql` =
    ```
    INSERT INTO episode_subtitles (movie_id, season_no, episode_no, url, lang, label, kind)
    VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(movie_id, season_no, episode_no) DO UPDATE SET
      url = excluded.url, lang = excluded.lang, label = excluded.label, kind = excluded.kind
    ```
  - `params` = urutan: untuk setiap row → `[movieId, row.seasonNo, row.episodeNo, row.url, row.lang, row.label, row.kind]`
  - Jumlah `VALUES` group = `rows.length` (bukan hardcode 2)

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Tambahkan `fetchSubtitles` / `saveSubtitles` + DDL di `src/lib/db.ts`**

- Tambahkan interface `DbEpisodeSubtitle` dan import `buildDeleteSubtitlesSql, buildInsertSubtitlesSql, SubtitleRowInput` dari `./subtitleSql`.
- `fetchSubtitles(movieId)`:
  ```ts
  return dbQuery<DbEpisodeSubtitle>(
    'SELECT movie_id, season_no, episode_no, url, lang, label, kind FROM episode_subtitles WHERE movie_id = ?',
    [movieId]
  )
  ```
- `saveSubtitles(movieId, rows)`:
  1. `await dbQuery(buildDeleteSubtitlesSql(), [movieId])`
  2. `const built = buildInsertSubtitlesSql(movieId, rows); if (built) await dbQuery(built.sql, built.params)`
- Di `runMigration()`, tambahkan setelah `CREATE TABLE IF NOT EXISTS movies (...)`:
  ```sql
  CREATE TABLE IF NOT EXISTS episode_subtitles (
    movie_id   TEXT    NOT NULL,
    season_no  INTEGER NOT NULL DEFAULT 0,
    episode_no INTEGER NOT NULL DEFAULT 0,
    url        TEXT    NOT NULL,
    lang       TEXT    NOT NULL DEFAULT 'id',
    label      TEXT    NOT NULL DEFAULT 'Indonesia',
    kind       TEXT    NOT NULL DEFAULT 'subtitles',
    PRIMARY KEY (movie_id, season_no, episode_no)
  )
  ```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error

- [ ] **Step 7: Commit**

```bash
git add src/lib/subtitleSql.ts src/lib/subtitleSql.test.ts src/lib/db.ts
git commit -m "feat: add episode_subtitles table and db accessors"
```

---

## Task 3: Backend proxies (download + subtitle), Express dan Cloudflare

**Files:**
- Modify: `server.ts`
- Create: `functions/api/stream/download.ts`, `functions/api/subtitle.ts`

**Interfaces:**
- Consumes: `resolveEpisodeSource`, `sanitizeFilename` dari `../../src/lib/streamUrls` (functions) dan `./src/lib/streamUrls` (server.ts)
- Produces: dua endpoint HTTP
  - `GET /api/stream/download?movieId=<id>&slot=1|2&season=<n>&episode=<n>` → stream file + `Content-Disposition: attachment`
  - `GET /api/subtitle?movieId=<id>&season=<n>&episode=<n>` → raw text subtitle + `Access-Control-Allow-Origin: *`

- [ ] **Step 1: Tulis helper Turso query di `server.ts`**

Tambahkan fungsi internal (bukan export):
```ts
async function tursoQuery(sql: string, params: any[]): Promise<any[]> {
  const httpUrl = (process.env.TURSO_DATABASE_URL || '').replace('libsql://', 'https://')
  const resp = await fetch(`${httpUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql, args: params } }] }),
  })
  const data = await resp.json()
  const result = data.results?.[0]?.response?.result
  const cols: { name: string }[] = result?.cols || []
  const rawRows: { type: string; value: any }[][] = result?.rows || []
  return rawRows.map((row) => Object.fromEntries(cols.map((col, i) => [col.name, row[i]?.value ?? null])))
}
```
> Pola ini disalin dari `functions/api/db/query.ts:102-110` — repo ini memang memakai implementasi paralel, bukan helper bersama. **Jangan** buat abstraksi baru di task ini.

- [ ] **Step 2: Implementasikan route download di `server.ts`**

```ts
app.get('/api/stream/download', async (req, res) => {
  const movieId = String(req.query.movieId || '')
  const slot = req.query.slot === '2' ? 2 : 1
  const season = Number(req.query.season || 0)
  const episode = Number(req.query.episode || 0)
  if (!movieId) return res.status(400).json({ error: 'movieId is required' })

  const rows = await tursoQuery(
    'SELECT id, title, stream_url, stream_url_2 FROM movies WHERE id = ?',
    [movieId]
  )
  const movie = rows[0]
  if (!movie) return res.status(404).json({ error: 'Movie not found' })

  const url = resolveEpisodeSource({
    streamUrl: movie.stream_url,
    streamUrl2: movie.stream_url_2,
    season, episode, slot,
  })
  if (!url) return res.status(404).json({ error: 'No stream URL for this episode' })

  const range = req.headers.range
  const upstream = await fetch(url, { headers: range ? { Range: range } : {} })
  if (!upstream.ok || !upstream.body) {
    return res.status(502).json({ error: `Upstream responded ${upstream.status}` })
  }

  res.setHeader('Content-Type', 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(movie.title)}.mp4"`)
  const len = upstream.headers.get('content-length')
  const contentRange = upstream.headers.get('content-range')
  const acceptRanges = upstream.headers.get('accept-ranges')
  if (len) res.setHeader('Content-Length', len)
  if (contentRange) res.setHeader('Content-Range', contentRange)
  if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges)
  res.status(upstream.status === 206 ? 206 : 200)
  Readable.fromWeb(upstream.body as any).pipe(res)
})
```
Tambahkan `import { Readable } from 'stream'` di bagian atas `server.ts`, dan `import { resolveEpisodeSource, sanitizeFilename } from './src/lib/streamUrls'`.

- [ ] **Step 3: Implementasikan route subtitle di `server.ts`**

```ts
app.get('/api/subtitle', async (req, res) => {
  const movieId = String(req.query.movieId || '')
  const season = Number(req.query.season || 0)
  const episode = Number(req.query.episode || 0)
  if (!movieId) return res.status(400).json({ error: 'movieId is required' })

  const rows = await tursoQuery(
    'SELECT url, lang, label, kind FROM episode_subtitles WHERE movie_id = ? AND season_no = ? AND episode_no = ?',
    [movieId, season, episode]
  )
  const row = rows[0]
  if (!row) return res.status(404).json({ error: 'Subtitle not found' })

  const upstream = await fetch(row.url)
  if (!upstream.ok) return res.status(502).json({ error: `Upstream responded ${upstream.status}` })
  const text = await upstream.text()
  res.setHeader('Content-Type', row.url.toLowerCase().split('?')[0].endsWith('.srt')
    ? 'text/plain; charset=utf-8'
    : 'text/vtt; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(text)
})
```

- [ ] **Step 4: Buat `functions/api/stream/download.ts` (Cloudflare)**

Isi: handler `onRequest(context)` dengan `const { request, env } = context`.
- Parse query dari `new URL(request.url).searchParams`.
- Turso query inline (helper lokal `tursoQuery(env, sql, params)` — salin pola `functions/api/db/query.ts:90-110`, dengan `env.TURSO_DATABASE_URL` / `env.TURSO_AUTH_TOKEN`).
- Resolve URL dengan `resolveEpisodeSource` dari `../../../src/lib/streamUrls`.
- `fetch(url, { headers: range ? { Range: range } : {} })` → `return new Response(upstream.body, { status, headers })` dengan header `Content-Type`, `Content-Disposition`, `Content-Length`, `Content-Range`, `Accept-Ranges`.
- Error → `new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } })`.

> **Fallback kalau build Cloudflare menolak import dari luar `functions/`:** salin `src/lib/streamUrls.ts` ke `functions/api/_lib/streamUrls.ts` dan ubah 2 baris import di kedua file functions. Catat ini di PR.

- [ ] **Step 5: Buat `functions/api/subtitle.ts` (Cloudflare)**

Isi: handler `onRequest(context)`:
- Parse query.
- Turso query `SELECT url, lang, label, kind FROM episode_subtitles WHERE movie_id = ? AND season_no = ? AND episode_no = ?`.
- `fetch(row.url)` → `await upstream.text()`.
- Return `new Response(text, { status: 200, headers: { 'Content-Type': ..., 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } })`.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: tidak ada error

- [ ] **Step 7: Smoke test endpoint subtitle (server lokal)**

Jalankan `npm run server` di terminal terpisah, lalu:
```bash
curl -i "http://localhost:3001/api/subtitle?movieId=1&season=0&episode=0"
```
Expected: `404` dengan body `{"error":"Subtitle not found"}` (belum ada data) — **bukan** 500. Ini membuktikan route-nya hidup dan query-nya jalan.

- [ ] **Step 8: Commit**

```bash
git add server.ts functions/api/stream/download.ts functions/api/subtitle.ts
git commit -m "feat: add download and subtitle proxy endpoints"
```

---

## Task 4: Client endpoint builders + playback position helper

**Files:**
- Create: `src/lib/streamEndpoints.ts`, `src/lib/streamEndpoints.test.ts`, `src/lib/playbackPosition.ts`, `src/lib/playbackPosition.test.ts`

**Interfaces:**
- Consumes: `detectSubtitleType` dari `./streamUrls`
- Produces:
  ```ts
  // src/lib/streamEndpoints.ts
  export const API_BASE: string   // import.meta.env.VITE_API_BASE_URL || '/api'
  export function buildDownloadUrl(params: {
    movieId: string
    slot: 1 | 2
    season?: number
    episode?: number
  }): string
  export function buildSubtitleProxyUrl(params: {
    movieId: string
    season: number
    episode: number
  }): string
  ```
  ```ts
  // src/lib/playbackPosition.ts
  export function playbackKey(movieSlug: string, season: number, episode: number): string
  export function savePlaybackPosition(key: string, seconds: number): void
  export function loadPlaybackPosition(key: string): number
  export function clearPlaybackPosition(key: string): void
  ```

- [ ] **Step 1: Tulis test yang gagal - `src/lib/playbackPosition.test.ts` dan `src/lib/streamEndpoints.test.ts`**

- Stub `globalThis.localStorage` dengan object in-memory (`{ getItem, setItem, removeItem }`).
- `playbackKey('dune-2021', 1, 3)` → `'dune-2021:1:3'`
- `playbackKey('dune-2021', 0, 0)` → `'dune-2021:0:0'`
- `savePlaybackPosition('k', 42.5)` lalu `loadPlaybackPosition('k')` → `42.5`
- `loadPlaybackPosition('tidak-ada')` → `0`
- `clearPlaybackPosition('k')` → `loadPlaybackPosition('k')` → `0`
- `savePlaybackPosition('k', 0)` → `loadPlaybackPosition('k')` → `0` (nilai 0 boleh disimpan, tidak boleh jadi NaN)
- **Review Focus #5**: kalau `globalThis.localStorage` di-set ke `undefined`, `savePlaybackPosition` dan `loadPlaybackPosition` **tidak boleh melempar** — `loadPlaybackPosition` → `0`

Test untuk `src/lib/streamEndpoints.test.ts`:

- `buildDownloadUrl({ movieId: 'm1', slot: 1, season: 0, episode: 0 })` → diawali `'/api/stream/download?'`, memuat `movieId=m1`, `slot=1`, `season=0`, `episode=0`
- `buildDownloadUrl` tanpa `season`/`episode` → tetap memuat `season=0&episode=0`
- `buildSubtitleProxyUrl({ movieId: 'm1', season: 2, episode: 5 })` → diawali `'/api/subtitle?'`, memuat `season=2`, `episode=5`
- **Review Focus #4**: `buildSubtitleProxyUrl({ movieId: 'a b&c=d', ... })` → `movieId` ter-URL-encode (tidak boleh memuat `&` mentah atau `=` yang merusak query string) — cek dengan `new URL(url).searchParams.get('movieId') === 'a b&c=d'`
- `buildSubtitleProxyUrl` → `new URL(url).searchParams.get('movieId')` round-trip benar untuk id dengan karakter khusus

- [ ] **Step 2: Jalankan test untuk memastikan gagal**

Run: `npm test`
Expected: FAIL — "Cannot find module '@/lib/playbackPosition'"

- [ ] **Step 3: Implementasikan `src/lib/playbackPosition.ts`**

- `playbackKey(slug, season, episode)` → `` `${slug}:${season}:${episode}` ``
- Simpan dengan prefix: `localStorage.setItem('cinevora:pos:' + key, String(seconds))`
- Semua akses `localStorage` dibungkus `try/catch`; `loadPlaybackPosition` mengembalikan `0` bila gagal baca / nilai bukan number finite.
- `savePlaybackPosition` mengabaikan nilai negatif atau `NaN`.

- [ ] **Step 4: Implementasikan `src/lib/streamEndpoints.ts`**

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function buildDownloadUrl(params: { movieId: string; slot: 1 | 2; season?: number; episode?: number }): string {
  const q = new URLSearchParams({
    movieId: params.movieId,
    slot: String(params.slot),
    season: String(params.season ?? 0),
    episode: String(params.episode ?? 0),
  })
  return `${API_BASE}/stream/download?${q.toString()}`
}

export function buildSubtitleProxyUrl(params: { movieId: string; season: number; episode: number }): string {
  const q = new URLSearchParams({
    movieId: params.movieId,
    season: String(params.season),
    episode: String(params.episode),
  })
  return `${API_BASE}/subtitle?${q.toString()}`
}
```
`URLSearchParams` otomatis meng-URL-encode `movieId` → aman untuk id berisi karakter khusus (Review Focus #4).
`detectSubtitleType` **tidak** dipakai di file ini; dipakai di `VideoPlayer`.

- [ ] **Step 5: Jalankan test untuk memastikan lulus**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/streamEndpoints.ts src/lib/playbackPosition.ts src/lib/playbackPosition.test.ts
git commit -m "feat: add client endpoint builders and playback position storage"
```

---

## Task 5: Player component (Vidstack)

**Files:**
- Create: `src/components/player/VideoPlayer.tsx`, `src/components/player/index.ts`
- Modify: `package.json`, `src/main.tsx`, `src/styles/globals.css`

**Interfaces:**
- Consumes: `detectSubtitleType` dari `@/lib/streamUrls`, `playbackKey, loadPlaybackPosition, savePlaybackPosition` dari `@/lib/playbackPosition`, `buildSubtitleProxyUrl` dari `@/lib/streamEndpoints`
- Produces:
  ```tsx
  export interface VideoPlayerSubtitle {
    url: string          // URL file subtitle di CDN (dipakai hanya untuk deteksi tipe)
    lang: string
    label: string
    kind: string
  }
  export interface VideoPlayerProps {
    src: string
    title?: string
    storageKey: string
    movieId: string
    season: number
    episode: number
    subtitle?: VideoPlayerSubtitle | null
    onEnded?: () => void
    onError?: () => void
  }
  export default function VideoPlayer(props: VideoPlayerProps): JSX.Element
  ```

- [ ] **Step 1: Install Vidstack**

```bash
npm i @vidstack/react@1.15.7
```

- [ ] **Step 2: Import CSS di `src/main.tsx`**

Tambahkan **di atas** `import './styles/globals.css'`:
```ts
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
```

- [ ] **Step 3: Override tema di `src/styles/globals.css`**

Tambahkan di akhir file:
```css
:root {
  --vds-color-media-primary: #e50914;
  --vds-color-media-primary-hover: #ff1a2a;
  --vds-color-media-background: #0f0f0f;
  --vds-color-media-foreground: #ffffff;
}
```

- [ ] **Step 4: Implementasikan `src/components/player/VideoPlayer.tsx`**

Struktur yang harus ada (bukan transkrip — implementasikan dengan API Vidstack):
- `const player = useRef<MediaPlayerInstance>(null)`
- `<MediaPlayer ref={player} src={src} title={title} onEnded={...} onError={...} keyShortcuts={MEDIA_KEY_SHORTCUTS}>`
  - `keyShortcuts` pakai `MEDIA_KEY_SHORTCUTS` dari `vidstack` agar PiP/speed/caption punya shortcut default.
  - `onEnded` → panggil prop `onEnded`.
  - `onError` → panggil prop `onError` **hanya sekali** (pakai ref flag) supaya tidak spam.
- Di dalam `<MediaProvider>`: render `<Track>` bila `subtitle` ada:
  ```tsx
  <Track
    src={buildSubtitleProxyUrl({ movieId, season, episode })}
    type={detectSubtitleType(subtitle.url)}
    kind={subtitle.kind as any}
    label={subtitle.label}
    lang={subtitle.lang}
  />
  ```
  `movieId`, `season`, `episode` diambil dari props `VideoPlayerProps`.
- Posisi playback:
  - `const [restored, setRestored] = useState(false)`
  - saat `duration`/metadata siap (event `onCanPlay` atau `onDurationChange` dari Vidstack), bila `!restored` → `player.current.currentTime = loadPlaybackPosition(storageKey)` dan set `restored = true`.
  - throttling: simpan posisi setiap 5 detik via `onTimeUpdate` (pakai ref timestamp), plus saat `onPause` dan saat unmount.
  - **Jangan** simpan posisi `0` sebagai "sudah ditonton" — biarkan `savePlaybackPosition` yang memutuskan.
- Tampilan error: bila `onError` terpanggil, tampilkan pesan "Gagal memuat video. Coba server lain." di atas player.
- Height: bungkus dalam `<div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">`.

- [ ] **Step 5: Buat `src/components/player/index.ts`**

```ts
export { default as VideoPlayer } from './VideoPlayer'
export type { VideoPlayerProps, VideoPlayerSubtitle } from './VideoPlayer'
```

- [ ] **Step 6: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: tidak ada error

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/main.tsx src/styles/globals.css src/components/player
git commit -m "feat: add Vidstack player component"
```

---

## Task 6: Watch page + hook subtitle

**Files:**
- Modify: `src/pages/WatchPage/index.tsx`, `src/hooks/useMovies.ts`

**Interfaces:**
- Consumes: `VideoPlayer` dari `@/components/player`, `buildDownloadUrl` dari `@/lib/streamEndpoints`, `fetchSubtitles` dari `@/lib/db`, `resolveEpisodeSource` dari `@/lib/streamUrls`
- Produces (di `src/hooks/useMovies.ts`):
  ```ts
  export function useSubtitle(movieId: string | undefined, season: number, episode: number) {
    // returns { data: DbEpisodeSubtitle | null, isLoading: boolean }
  }
  ```
  Query key: `['subtitles', movieId, season, episode]`.

- [ ] **Step 1: Tambah `useSubtitle` di `src/hooks/useMovies.ts`**

Ikuti pola `useMovieBySlug` (baris 40-47): `useQuery` dengan `queryKey`, `queryFn` yang `try/catch` dan fallback `null`, `enabled: !!movieId && movieId.length > 0`. `queryFn` memanggil `db.fetchSubtitles(movieId)` lalu cari baris dengan `season_no === season && episode_no === episode` → return baris itu atau `null`.

- [ ] **Step 2: Ganti iframe dengan `VideoPlayer` di `src/pages/WatchPage/index.tsx`**

- Hapus import `getDownloadUrl` dari `@/lib/utils`.
- Tambahkan import: `VideoPlayer` dari `@/components/player`, `buildDownloadUrl` dari `@/lib/streamEndpoints`, `playbackKey` dari `@/lib/playbackPosition`, `useSubtitle` dari `@/hooks/useMovies`, `resolveEpisodeSource` dan `resolveActiveSource` dari `@/lib/streamUrls`.
- Hitung sumber aktif **dengan `resolveEpisodeSource` + `resolveActiveSource`** (bukan logika manual), supaya client dan server memakai fungsi yang sama:
  ```ts
  const primary = resolveEpisodeSource({
    streamUrl: movie.streamUrl,
    streamUrl2: movie.streamUrl2,
    season: activeSeason,
    episode: activeEpisode,
    slot: 1,
  })
  const mirror = resolveEpisodeSource({
    streamUrl: movie.streamUrl,
    streamUrl2: movie.streamUrl2,
    season: activeSeason,
    episode: activeEpisode,
    slot: 2,
  })
  const currentStreamUrl = resolveActiveSource({
    primary,
    mirror,
    preferMirror: activeServer === 'server2',
  }) || ''
  ```
  **Review Focus #3** — `resolveActiveSource` sudah menangani fallback: `preferMirror` → `mirror || primary`; selain itu → `primary || mirror`. Slot 2 yang kosong **tidak** membuat player blank.
  **Perhatikan:** untuk film, `activeSeason`/`activeEpisode` bernilai 1 secara default — `resolveEpisodeSource` mengabaikan season/episode bila `streamUrl` bukan JSON, jadi aman. Pastikan nilai default `activeSeason`/`activeEpisode` tetap `1`.
- Ganti blok `<iframe>` (baris 102-109) dengan:
  ```tsx
  <VideoPlayer
    key={currentStreamUrl}
    src={currentStreamUrl}
    title={movie.title}
    movieId={movie.id}
    season={isSeries ? activeSeason : 0}
    episode={isSeries ? activeEpisode : 0}
    storageKey={playbackKey(slug, isSeries ? activeSeason : 0, isSeries ? activeEpisode : 0)}
    subtitle={subtitle}
    onError={() => setStreamError(true)}
  />
  ```
  `subtitle` berasal dari `useSubtitle(movie.id, isSeries ? activeSeason : 0, isSeries ? activeEpisode : 0)` → `data` (bertipe `DbEpisodeSubtitle | null`) di-map menjadi `{ url: data.url, lang: data.lang, label: data.label, kind: data.kind }`, atau `null` bila `data` null.
- Tampilkan `streamError` sebagai pesan di atas player (bukan mengganti player).
- Tombol Download (baris 195-204): ganti `getDownloadUrl(currentStreamUrl)` dengan
  ```tsx
  {currentStreamUrl && (
    <a href={buildDownloadUrl({ movieId: movie.id, slot: activeServer === 'server2' ? 2 : 1, season: isSeries ? activeSeason : 0, episode: isSeries ? activeEpisode : 0 })} ...>
  ```
  Hapus `target="_blank"` (download via proxy sudah memaksa attachment).
- Judul toggle server tetap "Server 1" / "Server 2" (dipilih manual).

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: tidak ada error

- [ ] **Step 4: Commit**

```bash
git add src/pages/WatchPage/index.tsx src/hooks/useMovies.ts
git commit -m "feat: use Vidstack player on watch page with subtitle support"
```

---

## Task 7: Admin panel — hapus normalizer embed, tambah input subtitle

**Files:**
- Modify: `src/components/admin/MovieForm/index.tsx`, `src/components/admin/MovieForm/SeasonsManager.tsx`

**Interfaces:**
- Consumes: `normalizeDirectUrl` dari `@/lib/streamUrls`, `saveSubtitles` dari `@/lib/db`
- Produces:
  ```ts
  // di src/components/admin/MovieForm/index.tsx
  const SUBTITLE_LANGUAGES = [
    { value: 'id', label: 'Indonesia' },
    { value: 'en', label: 'English' },
  ] as const
  ```
  Season/episode shape berubah (tambahan field `sub`):
  ```ts
  interface Episode { episode: number; url: string; url2?: string; sub?: string }
  interface Season { season: number; episodes: Episode[] }
  ```

- [ ] **Step 1: Hapus normalizer embed dari `src/components/admin/MovieForm/index.tsx`**

- Hapus fungsi `normalizeStreamUrl()` (baris 17-28) dan `normalizeAbyssUrl()` (baris 30-41).
- Hapus prop `normalizeStreamUrl` / `normalizeAbyssUrl` yang diteruskan ke `<SeasonsManager>`.
- Import `normalizeDirectUrl` dari `@/lib/streamUrls`.
- Di `handleSubmit`, baris 130-131:
  ```ts
  finalStreamUrl = rawStreamUrl ? normalizeDirectUrl(rawStreamUrl) : ''
  finalStreamUrl2 = rawStreamUrl2 ? normalizeDirectUrl(rawStreamUrl2) : ''
  ```
- Pastikan **tidak ada** lagi string `streamxylospace` / `abyssplayer` di file.

- [ ] **Step 2: Tambah input subtitle untuk film di `src/components/admin/MovieForm/index.tsx`**

- State baru: `const [subtitleUrl, setSubtitleUrl] = useState('')` dan `const [subtitleLang, setSubtitleLang] = useState<string>('id')`.
- Update tipe episode inline di `MovieForm` (baris 54) → tambah `sub?: string`:
  ```ts
  const [seasonsList, setSeasonsList] = useState<Array<{ season: number; episodes: Array<{ episode: number; url: string; url2?: string; sub?: string }> }>>([])
  ```
- Di `useEffect` yang memuat `editingMovie` (baris 65-104): muat subtitle film dari `db.fetchSubtitles(editingMovie.id)` → cari baris `season_no === 0 && episode_no === 0` → set `subtitleUrl` + `subtitleLang`. Tambahkan `import { addMovie, updateMovie, saveSubtitles, fetchSubtitles } from '@/lib/db'`.
  - `editingMovie.id` bisa `undefined` → skip fetch bila kosong.
- Render 1 input + 1 select **di section stream**, setelah input Server 2:
  - `<input name="subtitleUrl" value={subtitleUrl} onChange={...} placeholder="Subtitle URL (.vtt / .srt)..." />`
  - `<select value={subtitleLang} onChange={...}>` dari `SUBTITLE_LANGUAGES`.
- Di `handleSubmit`, **setelah** `updateMovie`/`addMovie` (dan setelah `movieId` diketahui):
  ```ts
  const subtitleRows = mediaType === 'series'
    ? seasonsList.flatMap((s) =>
        s.episodes
          .filter((ep) => (ep.sub || '').trim())
          .map((ep) => ({
            seasonNo: s.season,
            episodeNo: ep.episode,
            url: (ep.sub || '').trim(),
            lang: subtitleLang,
            label: SUBTITLE_LANGUAGES.find((l) => l.value === subtitleLang)?.label || 'Indonesia',
            kind: 'subtitles',
          }))
        )
    : (subtitleUrl.trim()
        ? [{ seasonNo: 0, episodeNo: 0, url: subtitleUrl.trim(), lang: subtitleLang,
             label: SUBTITLE_LANGUAGES.find((l) => l.value === subtitleLang)?.label || 'Indonesia',
             kind: 'subtitles' }]
        : [])
  await saveSubtitles(movieId, subtitleRows)
  ```
  `movieId` = `editingMovie.id` (mode edit) atau id yang dipakai saat `addMovie` (mode tambah) — **pastikan keduanya memakai id yang sama**; restructure `handleSubmit` bila perlu agar id tersedia sebelum `saveSubtitles` dipanggil. Cara yang disarankan: buat variabel `const movieId = editingMovie.id || String(Date.now())` **di awal** `handleSubmit`, lalu pakai `movieId` itu untuk `addMovie({ id: movieId, ...data })` **dan** untuk `saveSubtitles(movieId, subtitleRows)`. Dengan begitu tidak ada id yang berbeda antara tulis film dan tulis subtitle.

- [ ] **Step 3: Tambah input subtitle per episode di `src/components/admin/MovieForm/SeasonsManager.tsx`**

- Hapus props `normalizeStreamUrl` dan `normalizeAbyssUrl` dari interface + destructuring.
- Hapus `onBlur` yang memanggil normalizer pada kedua input (input URL episode sekarang disimpan apa adanya).
- Ganti placeholder: Server 1 → `"Server 1 URL (CDN)"`, Server 2 → `"Server 2 URL (CDN)"`.
- Tambah input ketiga di bawah keduanya:
  ```tsx
  <input
    type="text"
    value={ep.sub || ''}
    placeholder="Subtitle URL (.vtt / .srt)..."
    onChange={(e) => {
      const val = e.target.value
      const updated = [...seasonsList]
      updated[activeSeasonIndex].episodes[epIdx].sub = val
      setSeasonsList(updated)
    }}
    className="w-full bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
  />
  ```
- Update interface `Episode` di file ini → tambah `sub?: string`.
- Kartu episode tetap 3 input (ditumpuk vertikal) — tidak mengubah grid.

- [ ] **Step 4: Pastikan tidak ada string embed host tersisa di repo**

Run:
```bash
rg -n "streamxylospace|abyssplayer|abyss\.to|byse" src server.ts functions
```
Expected: **tidak ada output**. (Kalau ada, bersihkan di task ini.)

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: tidak ada error

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/MovieForm/index.tsx src/components/admin/MovieForm/SeasonsManager.tsx
git commit -m "feat: replace embed URL normalizers with direct CDN URLs and add subtitle input"
```

---

## Task 8: Hapus `getDownloadUrl`, update halaman detail, verifikasi akhir

**Files:**
- Modify: `src/lib/utils.ts`, `src/pages/MovieDetailPage/MovieHeroInfo.tsx`

**Interfaces:**
- Consumes: `buildDownloadUrl` dari `@/lib/streamEndpoints`
- Produces: tidak ada API baru

- [ ] **Step 1: Hapus `getDownloadUrl` dari `src/lib/utils.ts`**

Hapus fungsi `getDownloadUrl()` (baris 15-27) seluruhnya. Pastikan tidak ada file lain yang memakainya (cari `rg -n "getDownloadUrl" src`).

- [ ] **Step 2: Update tombol download di `src/pages/MovieDetailPage/MovieHeroInfo.tsx`**

- Ganti import `getDownloadUrl` dengan `buildDownloadUrl` dari `@/lib/streamEndpoints`.
- Tombol hanya untuk **film** (bukan series), karena untuk series tidak ada episode tunggal:
  ```tsx
  {movie.type !== 'series' && movie.streamUrl && (
    <a
      href={buildDownloadUrl({ movieId: movie.id, slot: 1, season: 0, episode: 0 })}
      className="..."
    >
      <IconDownload size={16} className="text-green-400" />
      Download
    </a>
  )}
  ```
- Hapus `target="_blank"` dan `rel="noopener noreferrer"` (download via proxy sudah memaksa `Content-Disposition: attachment`).

- [ ] **Step 3: Pastikan `getDownloadUrl` tidak tersisa**

Run: `rg -n "getDownloadUrl" src` → Expected: tidak ada output.

- [ ] **Step 4: Jalankan seluruh test + typecheck + build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: semua test PASS, typecheck bersih, build sukses.

- [ ] **Step 5: Verifikasi manual (butuh `npm run dev:all`)**

Urutannya persis:
1. Buka `/buahlilguanteng` → login → tab Tools → "Run Migration" (membuat tabel `episode_subtitles`).
2. Admin → edit sebuah film → isi "Video URL (CDN)" dengan URL MP4 milik sendiri + "Subtitle URL" dengan URL `.vtt` → simpan.
3. Buka halaman watch film tersebut:
   - Player Vidstack tampil, video_main diputar (bukan iframe).
   - Seek bar jalan (CDN mendukung Range).
   - Tombol PiP ada dan jalan; menu speed berubah kecepatan.
   - Tekan `k` → pause, `f` → fullscreen, `i` → PiP.
   - Subtitle Indonesia tampil di video.
   - Refresh halaman → video lanjut dari posisi yang sama.
4. Admin → kosongkan "Subtitle URL" → simpan → refresh watch page → subtitle hilang.
5. Untuk series: isi subtitle per episode → pindah episode → subtitle ikut berganti; posisi playback per episode terpisah.
6. Klik "Download" → file terunduh (bukan diputar di tab), nama file = judul film.
7. Ganti "Server 2" (kalau diisi) → player reload, posisi tidak reset ke 0.
8. Network tab: **tidak ada** request ke `streamxylospace.qzz.io` / `player.abyssplayer.com`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils.ts src/pages/MovieDetailPage/MovieHeroInfo.tsx
git commit -m "refactor: drop embed-era download URL helper"
```

---

## Catatan Penutup

- **Working tree tidak bersih.** 7 file yang akan disentuh plan ini sudah punya perubahan
  yang belum di-commit (pekerjaan sebelumnya: dukungan `stream_url_2` / Server 2 / `provider_id`):
  `src/lib/db.ts`, `src/lib/utils.ts` (belum tercantum di status — tapi ikut), `src/hooks/useMovies.ts`,
  `src/pages/WatchPage/index.tsx`, `src/pages/MovieDetailPage/MovieHeroInfo.tsx`,
  `src/components/admin/MovieForm/index.tsx`, `src/components/admin/MovieForm/SeasonsManager.tsx`.
  Konsekuensi: `git add <file>` pada langkah Commit **juga** akan ikut men-stage perubahan
  lama tersebut. Dua opsi: (a) user commit dulu pekerjaan yang belum selesai, atau
  (b) terima commit gabungan. Tanyakan ke user sebelum eksekusi pertama.
- **Tidak ada migrasi data.** Tabel `movies` tidak berubah; episode tetap JSON blob. Data lama (URL embed) diasumsikan sudah di-reset user. Kalau ternyata masih ada data lama yang dipakai, hasil watch page akan menampilkan player kosong — itu perilaku yang diharapkan (embed URL bukan file yang bisa diputar `<video>`).
- **Risiko tersisa setelah plan ini:** `server.ts` route `/api/db/query` masih tanpa cek auth (pre-existing, `server.ts:154-168`). Kalau Express di-deploy publik, itu celah. Tidak dikerjakan di plan ini karena di luar scope spec — tapi harus dikerjakan sebelum Express expose ke internet.
- **Optimisasi lanjutan (bukan dalam plan ini):** ganti proxy download dengan presigned URL CDN (R2/S3 `response-content-disposition`) supaya bandwidth tidak lewat backend.
