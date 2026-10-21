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
    if (Number.isFinite(duration) && duration > 0) {
      const tail = Math.min(RESUME_TAIL_SECONDS, duration * 0.1)
      if (saved > duration - tail) {
        clearPlaybackPosition(storageKey)
        return
      }
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

  // Show the subtitle track as soon as it is registered with the player.
  useEffect(() => {
    if (!subtitle) return
    const player = playerRef.current
    if (!player) return

    let cancelled = false
    const timer = window.setInterval(() => {
      if (cancelled) return
      if (player.textTracks.length === 0) return
      window.clearInterval(timer)
      player.remoteControl.changeTextTrackMode(0, 'showing')
    }, 150)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [subtitle, src])

  const trackSrc = subtitle
    ? buildSubtitleProxyUrl({ movieId, season, episode })
    : null

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <MediaPlayer
        ref={playerRef}
        src={src}
        aria-label={title}
        aspectRatio="16/9"
        streamType="on-demand"
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
              default
            />
          )}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
      </MediaPlayer>
    </div>
  )
}
