import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MediaPlayer,
  MediaProvider,
  TextTrack,
  MEDIA_KEY_SHORTCUTS,
  type MediaPlayerInstance,
  type MediaTimeUpdateEventDetail,
} from '@vidstack/react'
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default'
import GlassPlayButton from './GlassPlayButton'
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
  version?: string
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
  const subtitleTrackRef = useRef<TextTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)

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

  const togglePlayback = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (player.paused) {
      void player.play()
    } else {
      void player.pause()
    }
  }, [])

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
    ? buildSubtitleProxyUrl({
        movieId,
        season,
        episode,
        version: subtitle.version || subtitle.url,
      })
    : null

  // The track instance is created outside the effect on purpose: React's
  // StrictMode runs the effect twice, and adding the same instance twice is
  // deduplicated by Vidstack's track list. Creating a new instance per run
  // would register two entries and clear the `default` flag.
  const subtitleTrack = useMemo(() => {
    if (!subtitle || !trackSrc) return null
    return new TextTrack({
      src: trackSrc,
      type: detectSubtitleType(subtitle.url),
      kind: 'subtitles',
      label: subtitle.label,
      language: subtitle.lang,
      default: true,
    })
  }, [trackSrc, subtitle?.url, subtitle?.lang, subtitle?.label])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !subtitleTrack) return

    // The previous track is removed only when it is replaced. Removing it in
    // the effect cleanup would kill the track (Vidstack nulls its mode-change
    // handler on remove) and React's StrictMode runs cleanups between the two
    // effect passes.
    const previous = subtitleTrackRef.current
    if (previous && previous !== subtitleTrack) {
      player.textTracks.remove(previous)
    }
    subtitleTrackRef.current = subtitleTrack

    player.textTracks.add(subtitleTrack)

    // Drop stale duplicates of the same language, keeping the newest one.
    for (const other of player.textTracks.toArray()) {
      if (other !== subtitleTrack && other.language === subtitleTrack.language) {
        player.textTracks.remove(other)
      }
    }

    // Turn the caption on ourselves: Vidstack's own auto-selection only runs
    // once the provider is ready, which is too late for a late-mounted track.
    try {
      subtitleTrack.mode = 'showing'
    } catch {
      // Track is not attached to a media element yet.
    }
  }, [subtitleTrack])

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MediaPlayer
        ref={playerRef}
        src={src}
        aria-label={title}
        aspectRatio="16/9"
        streamType="on-demand"
        keyShortcuts={MEDIA_KEY_SHORTCUTS}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false)
          savePosition()
        }}
        onEnded={() => {
          setPlaying(false)
          savePosition()
          onEnded?.()
        }}
        onError={handleError}
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
      </MediaPlayer>

      {(!playing || hovered) && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
          <GlassPlayButton playing={playing} onClick={togglePlayback} />
        </div>
      )}
    </div>
  )
}
