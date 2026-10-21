import { useCallback, useEffect, useRef } from 'react'
import {
  MediaPlayer,
  MediaProvider,
  Track,
  MEDIA_KEY_SHORTCUTS,
  type MediaPlayerInstance,
  type MediaTimeUpdateEventDetail,
} from '@vidstack/react'
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default'
import { detectSubtitleType } from '@/lib/streamUrls'
import { buildSubtitleProxyUrl } from '@/lib/streamEndpoints'
import {
  clearPlaybackPosition,
  loadPlaybackPosition,
  savePlaybackPosition,
} from '@/lib/playbackPosition'

export interface VideoPlayerSubtitle {
  url: string
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

const SAVE_INTERVAL_MS = 5000
const RESUME_TAIL_SECONDS = 10

export default function VideoPlayer({
  src,
  title,
  storageKey,
  movieId,
  season,
  episode,
  subtitle,
  onEnded,
  onError,
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null)
  const restoredRef = useRef(false)
  const lastSaveRef = useRef(0)
  const errorNotifiedRef = useRef(false)

  useEffect(() => {
    restoredRef.current = false
    errorNotifiedRef.current = false
    lastSaveRef.current = 0
  }, [src])

  const savePosition = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    const time = player.currentTime
    if (!Number.isFinite(time) || time <= 0) return
    savePlaybackPosition(storageKey, time)
  }, [storageKey])

  useEffect(() => {
    return () => {
      savePosition()
    }
  }, [savePosition])

  const handleCanPlay = useCallback(() => {
    const player = playerRef.current
    if (!player || restoredRef.current) return
    restoredRef.current = true

    const saved = loadPlaybackPosition(storageKey)
    if (saved <= 0) return

    const duration = player.duration
    if (Number.isFinite(duration) && saved > duration - RESUME_TAIL_SECONDS) {
      clearPlaybackPosition(storageKey)
      return
    }

    try {
      player.currentTime = saved
    } catch {
      // Seeking before the media is fully ready is not fatal.
    }
  }, [storageKey])

  const handleTimeUpdate = useCallback(
    (detail: MediaTimeUpdateEventDetail) => {
      const now = Date.now()
      if (now - lastSaveRef.current < SAVE_INTERVAL_MS) return
      lastSaveRef.current = now
      savePlaybackPosition(storageKey, detail.currentTime)
    },
    [storageKey]
  )

  const handleError = useCallback(() => {
    if (errorNotifiedRef.current) return
    errorNotifiedRef.current = true
    onError?.()
  }, [onError])

  const trackSrc = subtitle
    ? buildSubtitleProxyUrl({ movieId, season, episode })
    : null

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <MediaPlayer
        ref={playerRef}
        src={src}
        title={title}
        aspectRatio="16/9"
        keyShortcuts={MEDIA_KEY_SHORTCUTS}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPause={savePosition}
        onEnded={() => {
          savePosition()
          onEnded?.()
        }}
        onError={handleError}
      >
        <MediaProvider>
          {subtitle && trackSrc && (
            <Track
              src={trackSrc}
              type={detectSubtitleType(subtitle.url)}
              kind={subtitle.kind as 'subtitles'}
              label={subtitle.label}
              lang={subtitle.lang}
            />
          )}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
      </MediaPlayer>
    </div>
  )
}
