import { z } from 'zod'

export const movieSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  rating: z.number().min(0).max(10),
  genre: z.array(z.string()).min(1),
  poster: z.string().url(),
  backdrop: z.string().url(),
  synopsis: z.string().min(1),
  isTrending: z.boolean(),
  isFeatured: z.boolean(),
  comingSoon: z.boolean(),
  releaseDate: z.string().optional(),
  quality: z.string().optional(),
  duration: z.string().optional(),
  type: z.enum(['movie', 'series']).optional(),
  episodes: z.number().int().positive().optional(),
  seasons: z.number().int().positive().optional(),
  tmdbId: z.number().optional(),
  imdbId: z.string().optional(),
  tagline: z.string().optional(),
  runtime: z.number().optional(),
  budget: z.number().optional(),
  revenue: z.number().optional(),
  originalLanguage: z.string().optional(),
  popularity: z.number().optional(),
  voteCount: z.number().optional(),
  homepage: z.string().optional(),
  director: z.string().optional(),
  cast: z.array(z.string()).optional(),
  trailerUrl: z.string().optional(),
  streamUrl: z.string().optional(),
  productionCompanies: z.array(z.string()).optional(),
  status: z.string().optional(),
})

export function validateMovie(data: unknown) {
  return movieSchema.safeParse(data)
}
