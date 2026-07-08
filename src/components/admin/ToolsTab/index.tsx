import type { Movie } from '@/types'
import DbStatusCard from './DbStatusCard'
import ExportCard from './ExportCard'
import SlugViewCard from './SlugViewCard'

interface ToolsTabProps {
  localMovies: Movie[]
  refetch: () => void
  runMigration: () => Promise<void>
  backfillSlugs: () => Promise<number>
  slugify: (text: string) => string
}

export default function ToolsTab({
  localMovies,
  refetch,
  runMigration,
  backfillSlugs,
  slugify,
}: ToolsTabProps) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Developer Tools</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Connection status and migration actions */}
        <DbStatusCard
          localMovies={localMovies}
          runMigration={runMigration}
          backfillSlugs={backfillSlugs}
          refetch={refetch}
        />

        {/* JSON exporters */}
        <ExportCard localMovies={localMovies} />

        {/* Slug visual backfiller view */}
        <SlugViewCard localMovies={localMovies} slugify={slugify} />

        {/* Quick diagnostic metadata info card */}
        <div className="bg-cinema-900 border border-white/[0.06] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Quick Info</h3>
          <div className="space-y-2 text-[12px] text-white/50">
            <p>
              Env: <span className="text-white/70">{import.meta.env.MODE}</span>
            </p>
            <p>
              Base URL: <span className="text-white/70">{window.location.origin}</span>
            </p>
            <p>
              Admin Path: <span className="text-cinema-red">/buahlilguanteng</span>
            </p>
            <p>
              TMDB API:{' '}
              <span className="text-white/70">
                {import.meta.env.VITE_TMDB_API_KEY ? 'Configured' : 'Missing'}
              </span>
            </p>
            <p className="text-[10px] text-white/20 mt-4">
              Built with React + Vite + TypeScript + Tailwind + Turso DB + TMDB
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
