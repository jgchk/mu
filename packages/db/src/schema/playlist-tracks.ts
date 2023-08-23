import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

import { playlists } from './playlists'
import { tracks } from './tracks'

export type PlaylistTrack = InferModel<typeof playlistTracks>
export type InsertPlaylistTrack = InferModel<typeof playlistTracks, 'insert'>
export const playlistTracks = sqliteTable('playlist_tracks', {
  id: integer('id').primaryKey(),
  playlistId: integer('playlist_id')
    .references(() => playlists.id, { onDelete: 'cascade' })
    .notNull(),
  trackId: integer('track_id')
    .references(() => tracks.id, { onDelete: 'cascade' })
    .notNull(),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const playlistTrackRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
  track: one(tracks, {
    fields: [playlistTracks.trackId],
    references: [tracks.id],
  }),
}))
