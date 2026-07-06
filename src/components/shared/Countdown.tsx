import { formatDistanceToNow } from 'date-fns'
import { IconClock } from '@tabler/icons-react'

interface CountdownProps {
  date: string
}

export default function Countdown({ date }: CountdownProps) {
  const target = new Date(date)
  const label = target > new Date() ? formatDistanceToNow(target) : 'Soon'
  return (
    <span className="flex items-center gap-1 text-[10px] text-white/40">
      <IconClock size={10} />
      {label}
    </span>
  )
}
