import React, { useState } from 'react'
import { IconX, IconGripVertical } from '@tabler/icons-react'

interface Episode {
  episode: number
  url: string
  url2?: string
  sub?: string
}

interface Season {
  season: number
  episodes: Episode[]
}

interface SeasonsManagerProps {
  seasonsList: Season[]
  setSeasonsList: React.Dispatch<React.SetStateAction<Season[]>>
  activeSeasonIndex: number
  setActiveSeasonIndex: (idx: number) => void
}

export default function SeasonsManager({
  seasonsList,
  setSeasonsList,
  activeSeasonIndex,
  setActiveSeasonIndex,
}: SeasonsManagerProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [isReadyToDrag, setIsReadyToDrag] = useState<boolean>(false)

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const updated = [...seasonsList]
    const episodes = [...updated[activeSeasonIndex].episodes]

    // Move episode from draggedIdx to target idx
    const [moved] = episodes.splice(draggedIdx, 1)
    episodes.splice(idx, 0, moved)

    updated[activeSeasonIndex].episodes = episodes
    setSeasonsList(updated)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
    setIsReadyToDrag(false)
  }

  return (
    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 bg-black/20 p-4 rounded-lg border border-white/[0.05] mt-2">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[12px] font-semibold text-white/80">Seasons & Episodes Manager</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const maxSeason = seasonsList.length > 0
                ? Math.max(...seasonsList.map((s) => s.season))
                : 0
              const newSeasonNum = maxSeason + 1
              setSeasonsList([...seasonsList, { season: newSeasonNum, episodes: [{ episode: 1, url: '' }] }])
              setActiveSeasonIndex(seasonsList.length)
            }}
            className="px-2 py-1 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 font-medium"
          >
            + Add Season
          </button>
          {seasonsList.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remove Season ${seasonsList[seasonsList.length - 1].season}?`)) {
                  const newList = seasonsList.slice(0, -1)
                  setSeasonsList(newList)
                  if (activeSeasonIndex >= newList.length) {
                    setActiveSeasonIndex(newList.length - 1)
                  }
                }
              }}
              className="px-2 py-1 bg-cinema-red/20 text-cinema-red text-[10px] rounded hover:bg-cinema-red/30 font-medium"
            >
              - Remove Season
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-white/[0.04]">
        {seasonsList.map((s, idx) => (
          <button
            key={s.season}
            type="button"
            onClick={() => setActiveSeasonIndex(idx)}
            className={`px-3 py-1 rounded text-[11px] font-medium shrink-0 transition-colors ${
              activeSeasonIndex === idx ? 'bg-cinema-red text-white' : 'bg-cinema-800 text-white/50 hover:text-white'
            }`}
          >
            Season {s.season}
          </button>
        ))}
      </div>

      {seasonsList[activeSeasonIndex] && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/40 font-medium col-span-2">
              Episodes ({seasonsList[activeSeasonIndex].episodes.length})
              <span className="text-[10px] text-white/25 ml-2 font-normal hidden sm:inline">(Drag handle to reorder)</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const updated = [...seasonsList]
                  const activeSeas = updated[activeSeasonIndex]
                  const maxEp = activeSeas.episodes.length > 0
                    ? Math.max(...activeSeas.episodes.map((e) => e.episode))
                    : 0
                  const nextEpNum = maxEp >= 0 ? maxEp + 1 : 1
                  activeSeas.episodes.push({ episode: nextEpNum, url: '' })
                  setSeasonsList(updated)
                }}
                className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 font-medium"
              >
                + Add Episode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {seasonsList[activeSeasonIndex].episodes.map((ep, epIdx) => (
              <div
                key={epIdx}
                draggable={isReadyToDrag && draggedIdx === epIdx}
                onDragStart={() => handleDragStart(epIdx)}
                onDragOver={(e) => handleDragOver(e, epIdx)}
                onDrop={() => handleDrop(epIdx)}
                onDragEnd={handleDragEnd}
                className={`flex items-start gap-1.5 bg-cinema-800/40 p-2 rounded border transition-all ${
                  draggedIdx === epIdx ? 'opacity-40 bg-cinema-800/20' : ''
                } ${
                  dragOverIdx === epIdx ? 'border-cinema-red border-dashed scale-[1.01]' : 'border-white/[0.04]'
                }`}
              >
                {/* Drag Handle */}
                <div
                  onMouseDown={() => {
                    setIsReadyToDrag(true)
                    setDraggedIdx(epIdx)
                  }}
                  onMouseUp={() => setIsReadyToDrag(false)}
                  className="cursor-grab active:cursor-grabbing text-white/20 hover:text-white/60 p-0.5 shrink-0 mt-1"
                  title="Drag to reorder"
                >
                  <IconGripVertical size={14} />
                </div>

                {/* Episode label / editor */}
                <div className="flex items-center bg-white/5 rounded border border-white/[0.02] px-1.5 py-0.5 shrink-0 gap-0.5 mt-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase">Ep</span>
                  <input
                    type="number"
                    value={ep.episode}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      const updated = [...seasonsList]
                      updated[activeSeasonIndex].episodes[epIdx].episode = val
                      setSeasonsList(updated)
                    }}
                    className="w-7 bg-transparent text-white text-[11px] font-bold text-center outline-none focus:text-cinema-red"
                  />
                </div>

                {/* Inputs container */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  {/* Server 1 Input */}
                  <input
                    type="text"
                    value={ep.url}
                    placeholder="Server 1 URL (CDN)..."
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = [...seasonsList]
                      updated[activeSeasonIndex].episodes[epIdx].url = val
                      setSeasonsList(updated)
                    }}
                    className="w-full bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
                  />

                  {/* Server 2 Input */}
                  <input
                    type="text"
                    value={ep.url2 || ''}
                    placeholder="Server 2 URL (CDN)..."
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = [...seasonsList]
                      updated[activeSeasonIndex].episodes[epIdx].url2 = val
                      setSeasonsList(updated)
                    }}
                    className="w-full bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
                  />

                  {/* Subtitle Input */}
                  <input
                    type="text"
                    value={ep.sub || ''}
                    placeholder="Subtitle URL (.vtt / .srt)..."
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = [...seasonsList]
                      updated[activeSeasonIndex].episodes[epIdx].sub = val
                      setSeasonsList(updated)
                    }}
                    className="w-full bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...seasonsList]
                    updated[activeSeasonIndex].episodes.splice(epIdx, 1)
                    setSeasonsList(updated)
                  }}
                  className="text-white/20 hover:text-cinema-red p-1 transition-colors shrink-0 mt-1"
                  title="Delete Episode"
                >
                  <IconX size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
