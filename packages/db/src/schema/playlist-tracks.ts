import type { InferModel } from 'drizzle-orm'
import { and, desc, eq } from 'drizzle-orm'
import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../utils'
import { makeUpdate, withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'
import { playlists } from './playlists'
import { tracks } from './tracks'

export type PlaylistTrack = InferModel<typeof playlistTracks>
export type InsertPlaylistTrack = InferModel<typeof playlistTracks, 'insert'>
export const playlistTracks = sqliteTable('playlist_tracks', {
  id: integer('id').primaryKey(),
  playlistId: integer('playlist_id')
    .references(() => playlists.id)
    .notNull(),
  trackId: integer('track_id')
    .references(() => tracks.id)
    .notNull(),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type PlaylistTracksMixin = {
  playlistTracks: {
    insert: (playlistTrack: AutoCreatedAt<InsertPlaylistTrack>) => PlaylistTrack
    insertMany: (playlistTracks: AutoCreatedAt<InsertPlaylistTrack>[]) => PlaylistTrack[]
    insertManyByPlaylistId: (
      playlistId: PlaylistTrack['playlistId'],
      trackIds: PlaylistTrack['trackId'][]
    ) => PlaylistTrack[]
    update: (id: PlaylistTrack['id'], data: UpdateData<InsertPlaylistTrack>) => PlaylistTrack
    updateByPlaylistId: (
      playlistId: PlaylistTrack['playlistId'],
      trackIds: PlaylistTrack['trackId'][]
    ) => PlaylistTrack[]
    addTrack: (
      playlistId: PlaylistTrack['playlistId'],
      trackId: PlaylistTrack['trackId']
    ) => PlaylistTrack
    find: (
      playlistId: PlaylistTrack['playlistId'],
      trackId: PlaylistTrack['trackId']
    ) => PlaylistTrack | undefined
    delete: (id: PlaylistTrack['id']) => void
    deleteByPlaylistId: (playlistId: PlaylistTrack['playlistId']) => void
  }
}

export const PlaylistTracksMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<PlaylistTracksMixin> & TBase =>
  class extends Base implements PlaylistTracksMixin {
    playlistTracks: PlaylistTracksMixin['playlistTracks'] = {
      insert: (playlistTrack) => {
        return this.db.insert(playlistTracks).values(withCreatedAt(playlistTrack)).returning().get()
      },

      insertMany: (playlistTracks_) => {
        if (playlistTracks_.length === 0) return []
        return this.db
          .insert(playlistTracks)
          .values(playlistTracks_.map(withCreatedAt))
          .returning()
          .all()
      },

      insertManyByPlaylistId: (playlistId, trackIds) => {
        return this.playlistTracks.insertMany(
          trackIds.map((trackId, order) => ({
            playlistId,
            trackId,
            order,
          }))
        )
      },

      update: (id, data) => {
        return this.db
          .update(playlistTracks)
          .set(makeUpdate(data))
          .where(eq(playlistTracks.id, id))
          .returning()
          .get()
      },

      updateByPlaylistId: (playlistId, trackIds) => {
        this.playlistTracks.deleteByPlaylistId(playlistId)
        return this.playlistTracks.insertManyByPlaylistId(playlistId, trackIds)
      },

      addTrack: (playlistId, trackId) => {
        const lastTrack = this.db
          .select()
          .from(playlistTracks)
          .where(eq(playlistTracks.playlistId, playlistId))
          .orderBy(desc(playlistTracks.order))
          .limit(1)
          .all()
          .at(0)
        const order = lastTrack ? lastTrack.order + 1 : 0
        return this.playlistTracks.insert({ playlistId, trackId, order })
      },

      find: (playlistId, trackId) => {
        return this.db
          .select()
          .from(playlistTracks)
          .where(
            and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId))
          )
          .limit(1)
          .all()
          .at(0)
      },

      delete: (id) => {
        return this.db.delete(playlistTracks).where(eq(playlistTracks.id, id)).run()
      },

      deleteByPlaylistId: (playlistId) => {
        return this.db.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId)).run()
      },
    }
  }
