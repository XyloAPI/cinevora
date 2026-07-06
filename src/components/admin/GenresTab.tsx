interface GenreData {
  name: string
  count: number
  href: string
}

interface GenresTabProps {
  genresData?: GenreData[]
}

export default function GenresTab({ genresData }: GenresTabProps) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Genre Manager</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {(genresData ?? []).map((g) => (
          <div key={g.name} className="bg-cinema-900 border border-white/[0.06] rounded-lg p-3 text-center">
            <p className="text-[13px] font-medium">{g.name}</p>
            <p className="text-[11px] text-white/30">{g.count} films</p>
          </div>
        ))}
      </div>
    </section>
  )
}
