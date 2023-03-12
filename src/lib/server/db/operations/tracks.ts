import { eq } from 'drizzle-orm/expressions'

import { db } from '../instance'
import { type InsertTrack, type Track, type TrackArtist, tracks } from '../schema'
import {
  deleteTrackArtistsByTrackId,
  getArtistsByTrackId,
  insertTrackArtists,
} from './track-artists'

export const insertTrack = (track: InsertTrack) => db.insert(tracks).values(track).returning().get()

export const insertTrackWithArtists = (
  data: InsertTrack & { artists?: TrackArtist['artistId'][] }
) => {
  const { artists: artistsData, ...trackData } = data
  const track = insertTrack(trackData)
  if (artistsData !== undefined) {
    insertTrackArtists(
      artistsData.map((artistId, order) => ({ trackId: track.id, artistId, order }))
    )
  }
  const artists = getArtistsByTrackId(track.id)
  return { ...track, artists }
}

export const updateTrack = (id: Track['id'], data: Partial<Omit<InsertTrack, 'id'>>) => {
  const update = {
    ...(data.path !== undefined ? { path: data.path } : {}),
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.releaseId !== undefined ? { releaseId: data.releaseId } : {}),
  }
  return db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
}

export const updateTrackWithArtists = (
  id: Track['id'],
  data: Partial<Omit<InsertTrack, 'id'>> & { artists?: TrackArtist['artistId'][] }
) => {
  const track = updateTrack(id, data)
  if (data.artists !== undefined) {
    deleteTrackArtistsByTrackId(id)
    insertTrackArtists(data.artists.map((artistId, order) => ({ trackId: id, artistId, order })))
  }
  const artists = getArtistsByTrackId(id)
  return { ...track, artists }
}

export const getTrackByPath = (path: Track['path']) => {
  const results = db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all()
  if (results.length === 0) {
    return undefined
  } else {
    return results[0]
  }
}

export const getTrackWithArtistsByPath = (path: Track['path']) => {
  const track = getTrackByPath(path)
  if (track === undefined) {
    return undefined
  }
  const artists = getArtistsByTrackId(track.id)
  return { ...track, artists }
}

export const getAllTracks = () => db.select().from(tracks).all()

export const getTracksByReleaseId = (releaseId: NonNullable<Track['releaseId']>) =>
  db.select().from(tracks).where(eq(tracks.releaseId, releaseId)).all()

export const getTrackById = (id: Track['id']) =>
  db.select().from(tracks).where(eq(tracks.id, id)).get()

export type TrackWithArtists = ReturnType<typeof getTrackWithArtistsById>
export const getTrackWithArtistsById = (id: Track['id']) => {
  const track = getTrackById(id)
  const artists = getArtistsByTrackId(id)
  return { ...track, artists }
}

export const deleteTrackById = (id: number) => db.delete(tracks).where(eq(tracks.id, id)).run()
