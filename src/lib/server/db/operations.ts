import { db } from './instance'
import { tracks, type InsertTrack } from './schema'
import { eq } from 'drizzle-orm/expressions'

export const insertTrack = (track: InsertTrack) => db.insert(tracks).values(track).returning().get()

export const getTrackByPath = (path: string) => {
  const results = db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all()
  if (results.length === 0) {
    return undefined
  } else {
    return results[0]
  }
}

export const getAllTracks = () => db.select().from(tracks).all()

export const deleteTrackById = (id: number) => db.delete(tracks).where(eq(tracks.id, id)).run()
