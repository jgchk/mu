import { sqliteTable, text, integer, type InferModel, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})
export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
})
export type Album = InferModel<typeof albums>
export type InsertAlbum = InferModel<typeof albums, 'insert'>

export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path),
  })
)
export type Track = InferModel<typeof tracks>
export type InsertTrack = InferModel<typeof tracks, 'insert'>
