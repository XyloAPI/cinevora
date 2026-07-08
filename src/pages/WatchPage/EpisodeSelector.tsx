import React from 'react'

interface Episode {
  episode: number
  url: string
}

interface Season {
  season: number
  episodes: Episode[]
}

interface EpisodeSelectorProps {
  seasonsList: Season[]
  activeSeason: number
  setActiveSeason: (s: number) => void
  activeEpisode: number
  setActiveEpisode: (e: number) => void
}

export default function EpisodeSelector({
  seasonsList,
  activeSeason,
  setActiveSeason,
  activeEpisode,
  setActiveEpisode,
}: EpisodeSelectorProps) {
  const activeSeasonData = seasonsList.find((s) => s.season === activeSeason)

  return (
    <div className="mt-6 bg-cinema-900/60 backdrop-blur border border-white/[0.05] rounded-xl p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        {/* Seasons Tab */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.05]">
          <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider shrink-0 mr-2">Seasons:</span>
          {seasonsList.map((s) => (
            <button
              key={s.season}
              onClick={() => {
                setActiveSeason(s.season)
                // Reset to first episode of selected season
                if (s.episodes.length > 0) {
                  setActiveEpisode(s.episodes[0].episode)
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                activeSeason === s.season
                  ? 'bg-cinema-red text-white shadow-lg shadow-cinema-red/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              Season {s.season}
            </button>
          ))}
        </div>

        {/* Episodes Grid */}
        {activeSeasonData && (
          <div>
            <span className="block text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">Episodes:</span>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {activeSeasonData.episodes.map((ep) => (
                <button
                  key={ep.episode}
                  onClick={() => setActiveEpisode(ep.episode)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 border ${
                    activeEpisode === ep.episode
                      ? 'bg-cinema-red/10 border-cinema-red text-cinema-red font-semibold'
                      : ep.url
                      ? 'bg-white/5 border-white/[0.04] text-white/80 hover:bg-white/10 hover:text-white'
                      : 'bg-white/[0.02] border-white/[0.02] text-white/30 cursor-not-allowed hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] opacity-60">EP</span>
                  <span className="text-sm">{ep.episode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
