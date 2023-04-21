import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../utils'
import { withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'
import { images } from './images'

export type Playlist = InferModel<typeof playlists>
export type InsertPlaylist = InferModel<typeof playlists, 'insert'>
export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageId: integer('image_id').references(() => images.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type PlaylistsMixin = {
  playlists: {
    insert: (playlist: AutoCreatedAt<InsertPlaylist>) => Playlist
    get: (id: Playlist['id']) => Playlist
    getAll: () => Playlist[]
    update: (id: Playlist['id'], data: UpdateData<InsertPlaylist>) => Playlist
    delete: (id: Playlist['id']) => void
  }
}

export const PlaylistsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<PlaylistsMixin> & TBase =>
  class extends Base implements PlaylistsMixin {
    playlists: PlaylistsMixin['playlists'] = {
      insert: (playlist) => {
        return this.db.insert(playlists).values(withCreatedAt(playlist)).returning().get()
      },

      get: (id) => {
        return this.db.select().from(playlists).where(eq(playlists.id, id)).get()
      },

      getAll: () => {
        return this.db.select().from(playlists).all()
      },

      update: (id, data) => {
        const update = {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        }
        return this.db.update(playlists).set(update).where(eq(playlists.id, id)).returning().get()
      },

      delete: (id) => {
        return this.db.delete(playlists).where(eq(playlists.id, id)).run()
      },
    }
  }
