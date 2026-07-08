import React from 'react'

interface Episode {
  episode: number
  url: string
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
  normalizeStreamUrl: (input: string) => string
}

export default function SeasonsManager({
  seasonsList,
  setSeasonsList,
  activeSeasonIndex,
  setActiveSeasonIndex,
  normalizeStreamUrl,
}: SeasonsManagerProps) {
  return (
    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 bg-black/20 p-4 rounded-lg border border-white/[0.05] mt-2">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[12px] font-semibold text-white/80">Seasons & Episodes Manager</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const newSeasonNum = seasonsList.length + 1
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
                if (confirm(`Remove Season ${seasonsList.length}?`)) {
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
            <span className="text-[11px] text-white/40 font-medium">
              Episodes ({seasonsList[activeSeasonIndex].episodes.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const updated = [...seasonsList]
                  const activeSeas = updated[activeSeasonIndex]
                  const nextEpNum = activeSeas.episodes.length + 1
                  activeSeas.episodes.push({ episode: nextEpNum, url: '' })
                  setSeasonsList(updated)
                }}
                className="px-2 py-0.5 bg-green-600/20 text-green-400 text-[10px] rounded hover:bg-green-600/30 font-medium"
              >
                + Add Episode
              </button>
              {seasonsList[activeSeasonIndex].episodes.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...seasonsList]
                    updated[activeSeasonIndex].episodes.pop()
                    setSeasonsList(updated)
                  }}
                  className="px-2 py-0.5 bg-cinema-red/20 text-cinema-red text-[10px] rounded hover:bg-cinema-red/30 font-medium"
                >
                  - Remove Episode
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {seasonsList[activeSeasonIndex].episodes.map((ep) => (
              <div key={ep.episode} className="flex items-center gap-2 bg-cinema-800/40 p-1.5 rounded border border-white/[0.04]">
                <span className="text-[10px] font-semibold text-white/50 shrink-0 w-8 text-center bg-white/5 py-0.5 rounded border border-white/[0.02]">
                  Ep {ep.episode}
                </span>
                <input
                  type="text"
                  value={ep.url}
                  placeholder="Stream URL / code..."
                  onChange={(e) => {
                    const val = e.target.value
                    const updated = [...seasonsList]
                    updated[activeSeasonIndex].episodes = updated[activeSeasonIndex].episodes.map((item) =>
                      item.episode === ep.episode ? { ...item, url: val } : item
                    )
                    setSeasonsList(updated)
                  }}
                  onBlur={() => {
                    if (ep.url.trim()) {
                      const normalized = normalizeStreamUrl(ep.url)
                      const updated = [...seasonsList]
                      updated[activeSeasonIndex].episodes = updated[activeSeasonIndex].episodes.map((item) =>
                        item.episode === ep.episode ? { ...item, url: normalized } : item
                      )
                      setSeasonsList(updated)
                    }
                  }}
                  className="flex-1 bg-cinema-800 text-white text-[11px] px-2 py-1 rounded border border-white/[0.06] outline-none focus:border-cinema-red/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
