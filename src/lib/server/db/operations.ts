import { db } from './instance'
import { tracks, type InsertTrack } from './schema'

export const insertTrack = (track: InsertTrack) => db.insert(tracks).values(track).returning().get()
