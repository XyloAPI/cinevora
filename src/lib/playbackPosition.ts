const STORAGE_PREFIX = 'cinevora:pos:'

export function playbackKey(movieSlug: string, season: number, episode: number): string {
  return `${movieSlug}:${season}:${episode}`
}

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

export function savePlaybackPosition(key: string, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds < 0) return
  try {
    globalThis.localStorage?.setItem(storageKey(key), String(seconds))
  } catch {
    // Storage unavailable (private mode, quota) - position is not critical.
  }
}

export function loadPlaybackPosition(key: string): number {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(key))
    if (raw === null || raw === undefined) return 0
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : 0
  } catch {
    return 0
  }
}

export function clearPlaybackPosition(key: string): void {
  try {
    globalThis.localStorage?.removeItem(storageKey(key))
  } catch {
    // Storage unavailable - nothing to clear.
  }
}
