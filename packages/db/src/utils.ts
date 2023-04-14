import type { InsertTrack, Track } from './schema'

export type TrackPretty = Omit<Track, 'favorite'> & {
  favorite: boolean
}
export type InsertTrackPretty = Omit<InsertTrack, 'favorite'> & {
  favorite?: boolean
}

export const convertInsertTrack = (track: InsertTrackPretty): InsertTrack => ({
  ...track,
  favorite: track.favorite ? 1 : 0,
})
export const convertTrack = (track: Track): TrackPretty => ({
  ...track,
  favorite: track.favorite !== 0,
})

export type AutoCreatedAt<T> = Omit<T, 'createdAt'>
export const withCreatedAt = <T>(
  model: AutoCreatedAt<T>
): AutoCreatedAt<T> & { createdAt: Date } => ({
  ...model,
  createdAt: new Date(),
})
