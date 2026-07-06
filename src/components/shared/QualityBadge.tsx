interface QualityBadgeProps {
  quality?: string
}

export default function QualityBadge({ quality }: QualityBadgeProps) {
  if (!quality) return null
  const cls = quality.toLowerCase().replace('-', '').replace(' ', '')
  return <span className={`badge-quality ${cls}`}>{quality}</span>
}
