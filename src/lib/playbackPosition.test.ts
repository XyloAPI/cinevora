import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  playbackKey,
  savePlaybackPosition,
  loadPlaybackPosition,
  clearPlaybackPosition,
} from '@/lib/playbackPosition'

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

const originalStorage = (globalThis as any).localStorage

beforeEach(() => {
  ;(globalThis as any).localStorage = new MemoryStorage()
})

afterEach(() => {
  ;(globalThis as any).localStorage = originalStorage
})

describe('playbackKey', () => {
  it('combines slug, season and episode', () => {
    expect(playbackKey('dune-2021', 1, 3)).toBe('dune-2021:1:3')
  })

  it('uses zeroes for movies', () => {
    expect(playbackKey('dune-2021', 0, 0)).toBe('dune-2021:0:0')
  })
})

describe('playback position storage', () => {
  it('round-trips a saved position', () => {
    savePlaybackPosition('k', 42.5)
    expect(loadPlaybackPosition('k')).toBe(42.5)
  })

  it('returns zero for an unknown key', () => {
    expect(loadPlaybackPosition('tidak-ada')).toBe(0)
  })

  it('clears a saved position', () => {
    savePlaybackPosition('k', 42.5)
    clearPlaybackPosition('k')
    expect(loadPlaybackPosition('k')).toBe(0)
  })

  it('keeps a zero position readable as zero', () => {
    savePlaybackPosition('k', 0)
    expect(loadPlaybackPosition('k')).toBe(0)
  })

  it('ignores negative and NaN values', () => {
    savePlaybackPosition('k', -10)
    expect(loadPlaybackPosition('k')).toBe(0)
    savePlaybackPosition('k', NaN)
    expect(loadPlaybackPosition('k')).toBe(0)
  })

  it('does not throw when localStorage is unavailable', () => {
    ;(globalThis as any).localStorage = undefined
    expect(() => savePlaybackPosition('k', 12)).not.toThrow()
    expect(loadPlaybackPosition('k')).toBe(0)
  })
})
