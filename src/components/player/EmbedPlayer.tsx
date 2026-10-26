interface EmbedPlayerProps {
  src: string
  title?: string
}

export function EmbedPlayer({ src, title }: EmbedPlayerProps) {
  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        src={src}
        title={title ?? 'Video player'}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        scrolling="no"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
