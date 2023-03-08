import { db } from './instance'
import { tracks, type InsertTrack, type Track } from './schema'
import { eq } from 'drizzle-orm/expressions'

export const insertTrack = (track: InsertTrack) => db.insert(tracks).values(track).returning().get()

export const updateTrack = (id: Track['id'], data: Partial<Omit<InsertTrack, 'id'>>) => {
  const update = {
    ...(data.path !== undefined ? { path: data.path } : {}),
    ...(data.title !== undefined ? { title: data.title } : {}),
  }
  return db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
}

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
