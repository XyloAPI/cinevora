<#
.SYNOPSIS
  Remux MKV -> MP4 (H.264 copied, audio EAC3/AC3 -> AAC) + extract subtitle internal ke .srt
  untuk workflow: upload MP4 ke CDN, lalu URL .srt-nya jadi "Subtitle URL" di admin panel.

.PARAMETER Source
  URL http(s) ke file .mkv, atau path file lokal.

.PARAMETER OutDir
  Folder output. Default: ./output

.PARAMETER AudioBitrate
  Default 192k

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\remux-to-mp4.ps1 -Source "https://.../film.mkv"

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\remux-to-mp4.ps1 -Source "D:\films\film.mkv" -OutDir "D:\out"
#>
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [string]$OutDir = "$PWD\output",
  [string]$AudioBitrate = "192k"
)

$ErrorActionPreference = 'Stop'
$ffmpeg = 'C:\Tools\ffmpeg\bin\ffmpeg.exe'
$ffprobe = 'C:\Tools\ffmpeg\bin\ffprobe.exe'
if (-not (Test-Path $ffmpeg)) { $ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source }
if (-not (Test-Path $ffprobe)) { $ffprobe = (Get-Command ffprobe -ErrorAction Stop).Source }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$name = [System.IO.Path]::GetFileNameWithoutExtension(([uri]$Source).AbsolutePath)
if (-not $name) { $name = [System.IO.Path]::GetFileNameWithoutExtension($Source) }
$mp4 = Join-Path $OutDir "$name.mp4"
$srt = Join-Path $OutDir "$name.srt"

Write-Host "Source : $Source" -ForegroundColor Cyan
Write-Host "Output : $mp4" -ForegroundColor Cyan

# --- Probe dulu: cek codec video/audio & ada/tidaknya subtitle internal ---
$probeArgs = @('-hide_banner', '-v', 'error', '-user_agent', 'Mozilla/5.0',
  '-show_entries', 'stream=index,codec_type,codec_name', '-of', 'csv=p=0', $Source)
$streams = & $ffprobe @probeArgs
$videoCodec = ($streams | Where-Object { $_ -match ',video,' } | Select-Object -First 1)
$audioCodec = ($streams | Where-Object { $_ -match ',audio,' } | Select-Object -First 1)
$hasSub = [bool]($streams | Where-Object { $_ -match ',subtitle,' })
Write-Host "Video  : $videoCodec" -ForegroundColor DarkGray
Write-Host "Audio  : $audioCodec" -ForegroundColor DarkGray
Write-Host "Subtitle internal: $hasSub" -ForegroundColor DarkGray

# --- Remux: video copy (tanpa re-encode), audio -> AAC ---
Write-Host "`nRemux berjalan... (video di-copy, audio di-encode)" -ForegroundColor Yellow
& $ffmpeg -hide_banner -loglevel warning -stats -stats_period 5 `
  -user_agent 'Mozilla/5.0' `
  -i $Source `
  -map 0:v:0 -c:v copy `
  -map 0:a:0 -c:a aac -b:a $AudioBitrate `
  -movflags +faststart `
  -y $mp4
if ($LASTEXITCODE -ne 0) { throw "ffmpeg remux gagal (exit $LASTEXITCODE)" }

# --- Ekstrak subtitle internal (kalau ada) jadi .srt terpisah ---
if ($hasSub) {
  Write-Host "`nMengekstrak subtitle internal -> $srt" -ForegroundColor Yellow
  & $ffmpeg -hide_banner -loglevel error -user_agent 'Mozilla/5.0' `
    -i $Source -map 0:s:0 -c:s srt -y $srt
}

$size = (Get-Item $mp4).Length
Write-Host "`nSelesai." -ForegroundColor Green
Write-Host "  MP4 : $mp4 ($([math]::Round($size / 1MB, 1)) MB)" -ForegroundColor Green
if (Test-Path $srt) { Write-Host "  SRT : $srt" -ForegroundColor Green }
Write-Host "`nLangkah berikutnya:" -ForegroundColor Cyan
Write-Host "  1. Upload MP4 ke CDN"
Write-Host "  2. Di admin panel: Video URL = <url mp4 di CDN>"
if (Test-Path $srt) { Write-Host "  3. Di admin panel: Subtitle URL = <url srt di CDN>" }
