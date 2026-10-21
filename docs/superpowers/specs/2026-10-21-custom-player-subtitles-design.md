# Desain: Custom Player (Vidstack) + Subtitle Self-Managed

**Tanggal:** 2026-10-21
**Status:** Disetujui (lisan) — menunggu review dokumen
**Scope:** Bagian video + bagian subtitle dari "revisi total" web

---

## 1. Konteks & Tujuan

Web streaming film (Cinevora) saat ini memutar video **100% lewat `<iframe>`** ke host pihak
ketiga (`streamxylospace.qzz.io/e/*` dan `player.abyssplayer.com/*`). Server tempat file
video berada saat ini adalah byse.sx / embed host pihak ketiga.

Tujuan:

1. Website dan file video pindah ke **CDN sendiri** (static storage: R2/S3/B2).
2. Player **tidak lagi** memakai embed pihak ketiga → pakai custom player (Vidstack).
3. Subtitle **dikelola sendiri**: admin menginput URL `.vtt`/`.srt` per episode.
4. Admin cukup **input URL file** — tidak ada upload, tidak ada ffmpeg, tidak ada pipeline.

### Keputusan yang sudah dikunci

| Topik | Keputusan |
|---|---|
| Player | Vidstack (`@vidstack/react`), bukan iframe |
| Format | URL file langsung dari CDN (`.mp4`). **Tanpa transcode ffmpeg** (sudah dievaluasi, compute/storage terlalu mahal untuk ribuan film) |
| HLS | Tidak dipakai. Kalau URL nanti `.m3u8`, Vidstack otomatis mendeteksi |
| Kualitas | Tidak ada menu quality (1 sumber). Menu muncul otomatis jika nanti ada >1 source / HLS |
| Server 1/2 | **Tetap 2 slot, dipilih manual** (toggling di watch page, seperti sekarang) |
| Download | **Tetap ada, download sungguhan via proxy backend** (`Content-Disposition: attachment`) |
| Fitur player | Ingat posisi playback, PiP, speed control, keyboard shortcut. **Bukan** poster/big-play, **bukan** auto-play episode berikutnya |
| Subtitle | 1 subtitle per episode. Disimpan di **tabel baru** `episode_subtitles` |
| Data lama | Akan di-reset user → **tidak ada migrasi/backfill** |
| Hosting | Tidak berubah (Cloudflare Pages + Express parity) |

---

## 2. Non-Goals (di luar scope)

- Tidak ada upload file dari admin.
- Tidak ada ffmpeg/transcode/HLS packaging.
- Tidak ada signed URL / proteksi konten.
- Tidak ada auto-play episode berikutnya, poster, atau thumbnail episode.
- Tidak ada perubahan pada: `src/lib/db.ts` (query movies), auth admin, integrasi TMDB, tema/UI halaman lain.
- Tidak ada restrukturisasi `movies.stream_url` (episode tetap JSON blob).

---

## 3. Model Data

### 3.1 Yang tidak berubah

`movies` table tetap sama persis. `movies.stream_url` untuk series tetap berisi JSON:

```json
[{ "season": 1, "episodes": [{ "episode": 1, "url": "<file-url>", "url2": "<file-url>" }] }]
```

Perubahan hanya **nilai**nya: sekarang berisi URL file langsung dari CDN, bukan URL embed.

### 3.2 Tabel baru: `episode_subtitles`

Episode tetap berupa JSON blob, jadi tabel subtitle memakai composite key
`(movie_id, season_no, episode_no)` — tidak butuh tabel `episodes` terpisah.

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
);
```

- **Film** (bukan series): `season_no = 0`, `episode_no = 0`.
- **Series**: `season_no` / `episode_no` sesuai aslinya.
- 1 baris per episode (sesuai kebutuhan). Kolom `lang`/`label` sudah disiapkan untuk
  multi-bahasa nanti tanpa perubahan skema.
- `kind` = `subtitles` | `captions` (ikut ke `<Track kind=...>`).

Tabel dibuat oleh `runMigration()` yang sudah ada (`src/lib/db.ts`), dipanggil saat
AdminPanel mount — jalur yang sama dengan `movies`.

---

## 4. Backend

### 4.1 Prinsip: URL tidak pernah datang dari client

Dua endpoint baru butuh URL file dari CDN. Agar tidak menjadi **open proxy / SSRF**,
URL **tidak pernah** diterima sebagai query parameter. Client hanya mengirim
`movie_id` + koordinat episode; server yang mengambil URL dari database.

### 4.2 `GET /api/stream/download`

```
/api/stream/download?movieId=<id>&slot=1|2&season=<n>&episode=<n>
```

- Resolve URL dari DB:
  - Film → `movies.stream_url` (slot 1) atau `movies.stream_url_2` (slot 2)
  - Series → parse JSON `movies.stream_url`, ambil `episodes[].url` / `url2`
- Fetch dari CDN, teruskan `Range` header dari client (resume & integrity).
- Response: stream body apa adanya + header:
  - `Content-Disposition: attachment; filename="<judul>.mp4"`
  - `Content-Type: application/octet-stream`
  - `Content-Length` diteruskan dari upstream
- Error: 404 (URL tidak ada), 502 (upstream gagal), 400 (parameter invalid)

### 4.3 `GET /api/subtitle`

```
/api/subtitle?movieId=<id>&season=<n>&episode=<n>
```

- Resolve baris `episode_subtitles` dari DB → dapat `url` CDN.
- Fetch konten dari CDN, return **raw** (tanpa konversi) + `Content-Type` sesuai
  ekstensi (`.vtt` → `text/vtt`, `.srt` → `text/plain`).
- Header: `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=3600`.

**Kenapa subtitle lewat proxy (bukan langsung ke CDN):**

1. **CORS** — text track di-fetch browser dengan CORS mode. Kalau CDN tidak mengirim
   `Access-Control-Allow-Origin`, subtitle **gagal total tanpa error yang jelas**.
   Lewat proxy → URL jadi same-origin → CORS tidak jadi masalah.
2. Konten subtitle kecil (~50–200 KB), jadi dilewatkan backend tidak berarti beban.

**SRT tidak perlu konversi** — Vidstack punya parser SRT bawaan (`type="srt"`).

### 4.4 Dua implementasi backend (paralel, wajib sinkron)

| Target | File |
|---|---|
| Express (lokal / Render) | `server.ts` |
| Cloudflare Pages Functions | `functions/api/stream/download.ts`, `functions/api/subtitle.ts` |

Keduanya butuh query Turso. Pola Turso HTTP pipeline (`POST {url}/v2/pipeline`) yang
sudah dipakai `functions/api/db/query.ts` di-copy ke file baru (repo ini memang
memakai pola duplikasi ini — `server.ts` dan `functions/` sudah paralel).

> **Catatan keamanan (pre-existing, di luar scope):** `server.ts` route `/api/db/query`
> (baris 154-168) **tidak punya** cek auth seperti versi Cloudflare
> (`functions/api/db/query.ts` baris 44-67). Untuk Express yang hanya dipakai lokal
> ini tidak kritis, tapi kalau Express di-deploy ke publik, itu celah SQL injection /
> data wipe. **Rekomendasi:** samakan (tambahkan cek token) atau pastikan Express
> tidak expose publik.

---

## 5. Player

### 5.1 Komponen baru: `src/components/player/VideoPlayer.tsx`

```tsx
interface VideoPlayerProps {
  src: string                 // URL file aktif (satu slot yang dipilih)
  title?: string
  storageKey: string          // kunci localStorage posisi playback
  onEnded?: () => void
  onFirstError?: () => void    // memicu UI "ganti server"
}
```

Isi:
- `<MediaPlayer>` + default theme Vidstack.
- `<MediaProvider>` untuk `<Track>` subtitle.
- **Simpan posisi playback** ke `localStorage` (throttle 5 detik + saat pause/unmount),
  key = `cinevora:pos:{storageKey}`.
- **Restore posisi** saat metadata siap → `player.currentTime = savedPos`.
- Kirim `onFirstError` saat video gagal dimuat → UI menawarkan ganti server.

### 5.2 Dependensi & CSS

```bash
npm i @vidstack/react@1.15.7
```

```ts
// src/main.tsx
import '@vidstack/react/player/styles/default/theme.css'
import '@vidstack/react/player/styles/default/layouts/video.css'
```

Override tema ke palet cinema di `src/styles/globals.css`:

```css
:root {
  --vds-color-media-primary: #E50914;
  --vds-color-media-background: #0F0F0F;
}
```

### 5.3 Fitur yang aktif (sudah bawaan default theme)

| Fitur | Cara |
|---|---|
| PiP | Default theme punya tombol Picture-in-Picture |
| Speed control | Default theme punya menu kecepatan (0.5×–2×) |
| Keyboard shortcut | `k`/`Space` pause, `m` mute, `f` fullscreen, `i` PiP, `c` caption, `j`/`l`/`←`/`→` seek, `↑`/`↓` volume, `>`/`<` speed |

### 5.4 Ganti server (2 slot, manual)

Alur di watch page (toggling **tetap** seperti sekarang):

1. User klik "Server 2" → `activeServer` berubah → `src` berubah.
2. `VideoPlayer` di-mount ulang (`key={currentStreamUrl}`).
3. Posisi playback **dipulihkan** dari `localStorage` → tidak mulai dari 0.
4. `<track>` subtitle ikut terpasang ulang (src-nya ikut berubah, memuat ulang track).

---

## 6. Alur Data di Watch Page

```
movie (dari useMovieBySlug)
  ├─ film    → sources: stream_url / stream_url_2
  └─ series  → parse stream_url JSON → season aktif → episode aktif → ep.url / ep.url2

subtitle (dari useSubtitle(movie.id, season, episode))
  └─ type = url.endsWith('.srt') ? 'srt' : 'vtt'   (dari URL yang tersimpan)
  └─ <Track src="/api/subtitle?movieId=..&season=..&episode=.." type={type}
           kind={kind} label={label} lang={lang} />
```

> Client memuat track lewat **URL proxy**, tapi tetap memerlukan baris DB-nya — untuk
> `label`, `lang`, `kind`, dan penentuan `type` dari ekstensi URL.

download
  └─ <a href="/api/stream/download?movieId=..&slot=..&season=..&episode=..">
```

### 6.1 Perubahan di `src/pages/WatchPage/index.tsx`

- `<iframe>` (baris 102-109) → `<VideoPlayer>`.
- `key={currentStreamUrl}` tetap dipakai → remount saat ganti server.
- Toggle Server 1/2 (baris 129-157) **tetap**, tapi judulnya diubah label agar jelas
  "Server 1" / "Server 2" (bukan "mirror otomatis").
- Tombol Download (baris 195-204): `getDownloadUrl()` diganti pemanggil URL proxy baru.
- Empty state (baris 110-125) tetap.

### 6.2 Perubahan di `src/lib/utils.ts`

- **Hapus** `getDownloadUrl()` (baris 15-27) — logika `/e/{code}` tidak berlaku lagi.
- **Tambah** `buildDownloadUrl({ movieId, slot, season, episode })` → URL proxy.
- **Tambah** `buildSubtitleProxyUrl({ movieId, season, episode })`.

---

## 7. Admin Panel

### 7.1 Normalizer dibuang

`src/components/admin/MovieForm/index.tsx`:
- **Hapus** `normalizeStreamUrl()` (baris 17-28) → rewrite ke `streamxylospace.qzz.io`.
- **Hapus** `normalizeAbyssUrl()` (baris 30-41) → rewrite ke `player.abyssplayer.com`.
- **Tambah** `normalizeDirectUrl(input)`: `trim()`, dan prepend `https://` bila scheme kosong.
  Tidak ada rewrite ke host lain — URL disimpan apa adanya.

`src/components/admin/MovieForm/SeasonsManager.tsx`:
- Hapus props `normalizeStreamUrl` / `normalizeAbyssUrl`.
- Placeholder input: "Server 1 URL (CDN)" / "Server 2 URL (CDN)".

### 7.2 Input subtitle

- **Film**: 1 input "Subtitle URL" + select bahasa (default `id` / "Indonesia") di
  `MovieForm`, section stream.
- **Series**: 1 input "Subtitle URL" per episode di kartu episode `SeasonsManager`.
  Kartu episode dirapikan: 3 input ditumpuk vertikal (Server 1, Server 2, Subtitle).

### 7.3 Save

`MovieForm.handleSubmit` jadi 2 tahap:

1. `updateMovie()` / `addMovie()` seperti sekarang (dapat `movieId`).
2. `saveSubtitles(movieId, rows)`:
   - `DELETE FROM episode_subtitles WHERE movie_id = ?`
   - `INSERT INTO episode_subtitles (...) VALUES (...), (...)` — 1 request, multi-row upsert
     (SQLite/Turso mendukung multi-row `VALUES` + `ON CONFLICT`).
   - Kirim 2 query (DELETE lalu INSERT) supaya penghapusan subtitle yang dikosongkan
     ikut tersimpan. 2 request per simpan — bukan per episode.

### 7.4 Read

`src/lib/db.ts` (tambahan saja; query `movies` yang existing tidak berubah):

```ts
export interface DbEpisodeSubtitle {
  movie_id: string; season_no: number; episode_no: number
  url: string; lang: string; label: string; kind: string
}
export async function fetchSubtitles(movieId: string): Promise<DbEpisodeSubtitle[]>
export async function saveSubtitles(movieId: string, rows: Omit<DbEpisodeSubtitle,'movie_id'>[]): Promise<void>
```

`src/hooks/useMovies.ts` (tambahan): `useSubtitle(movieId, seasonNo, episodeNo)`.

---

## 8. Ringkasan Perubahan File

### Baru
| File | Isi |
|---|---|
| `src/components/player/VideoPlayer.tsx` | Wrapper Vidstack + logic posisi playback |
| `src/components/player/index.ts` | Re-export |
| `src/lib/streamUrls.ts` | Logika pure bersama (client + server): normalisasi URL, resolusi episode→URL, fallback slot, deteksi tipe subtitle, sanitasi filename |
| `src/lib/streamEndpoints.ts` | Builders URL endpoint proxy (butuh `VITE_API_BASE_URL`) |
| `src/lib/subtitleSql.ts` | Builders SQL tulis/baca `episode_subtitles` |
| `src/lib/playbackPosition.ts` | Helper localStorage posisi playback |
| `src/lib/streamUrls.test.ts`, `src/lib/subtitleSql.test.ts`, `src/lib/playbackPosition.test.ts`, `src/lib/streamEndpoints.test.ts` | Test unit (Vitest) |
| `vitest.config.ts` | Konfigurasi Vitest |
| `functions/api/stream/download.ts` | Proxy download (Cloudflare) |
| `functions/api/subtitle.ts` | Proxy subtitle (Cloudflare) |
| `docs/superpowers/specs/2026-10-21-custom-player-subtitles-design.md` | Dokumen ini |
| `docs/superpowers/plans/2026-10-21-custom-player-subtitles.md` | Implementation plan |

### Diubah
| File | Perubahan |
|---|---|
| `package.json` | + `@vidstack/react@1.15.7`, + `vitest` (devDependency), script `test` |
| `src/main.tsx` | Import CSS Vidstack |
| `src/styles/globals.css` | Override CSS var tema cinema |
| `src/pages/WatchPage/index.tsx` | iframe → `VideoPlayer`; toggle server tetap; tombol Download → proxy |
| `src/components/admin/MovieForm/index.tsx` | Hapus 2 normalizer, tambah `normalizeDirectUrl`, input subtitle film, save subtitle |
| `src/components/admin/MovieForm/SeasonsManager.tsx` | Hapus props normalizer, tambah input subtitle per episode, rapikan kartu |
| `src/lib/utils.ts` | Hapus `getDownloadUrl`, tambah builder URL proxy |
| `src/lib/db.ts` | Tambah `fetchSubtitles` / `saveSubtitles`, tambah DDL di `runMigration` |
| `src/hooks/useMovies.ts` | Tambah `useSubtitle` |
| `server.ts` | Tambah route `/api/stream/download` + `/api/subtitle` |

### Tidak diubah
`src/lib/tmdb.ts`, `src/types/index.ts`, `src/components/admin/*` lain,
`functions/api/db/query.ts`, `functions/api/admin/login.ts`, `functions/api/tmdb/*`.

> `src/pages/MovieDetailPage/MovieHeroInfo.tsx` baris 157-159 memakai `getDownloadUrl()`
> untuk tombol download di halaman detail. Karena fungsi itu dihapus, pemanggilnya diganti
> ke `buildDownloadUrl({ movieId: movie.id, slot: 1, season: 0, episode: 0 })`.
> **Hanya untuk film** — untuk series `movie.streamUrl` berisi JSON episode tree sehingga
> tidak ada episode tunggal yang bisa diunduh; tombol download disembunyikan (perilaku
> sama seperti sekarang, di mana `getDownloadUrl()` mengembalikan `null` untuk JSON).

---

## 9. Risiko & Batasan

| Risiko | Mitigasi |
|---|---|
| CDN tidak mengirim CORS untuk subtitle | Subtitle lewat proxy backend (bukan URL langsung) |
| CDN tidak support HTTP Range | Player: seek tidak bisa loncat. R2/S3/B2 support default. Tidak ada workaround di sisi client |
| `Content-Type` salah untuk `.m3u8` | Tidak relevan (tidak pakai HLS). Kalau nanti dipakai, set saat upload |
| File `.mkv` | Browser tidak bisa memutar. Admin harus pakai `.mp4` (H.264/AAC). Validasi di form admin: beri peringatan kalau ekstensi bukan `.mp4`/`.webm`/`.m3u8` |
| Proxy download Corbeng bandwidth | Download jarang dipakai; kalau jadi masalah, ganti ke presigned URL CDN (R2/S3 `response-content-disposition`) — nol perubahan UI |
| Subtitle 1 bahasa saja | Skema sudah siap multi-bahasa (`lang`, `label`); tinggal buka form-nya |
| Klaim "file dari byse.sx" | Tidak ada kode byse.sx di repo. Embed host yang ada: `streamxylospace.qzz.io` & `player.abyssplayer.com` — keduanya dibuang bersama normalizer |

---

## 10. Verifikasi

1. `npm run build` lolos (`tsc -b` + vite build) tanpa error type.
2. `npx tsc --noEmit` bersih.
3. Manual, dengan `npm run dev:all`:
   - Film: URL file → Vidstack main, seek jalan, PiP jalan, speed jalan, posisi tersimpan
     (reload → lanjut dari posisi yang sama).
   - Ganti Server 1 → Server 2 → posisi tetap, tidak mulai dari 0.
   - Series: pindah episode → subtitle episode yang sesuai; posisi per episode terpisah.
   - Subtitle: file `.vtt` → tampil; file `.srt` → tampil (parser Vidstack).
   - Tombol download → file terunduh dengan nama benar, bukan diputar di tab.
   - Admin: simpan film + subtitle → subtitle muncul di watch page; kosongkan subtitle
     → subtitle hilang di watch page.
4. Tidak ada lagi request ke `streamxylospace.qzz.io` / `player.abyssplayer.com`
   (cek Network tab).
