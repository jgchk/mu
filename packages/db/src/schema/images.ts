import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../utils'
import { makeUpdate, withCreatedAt } from '../utils'
import { artists } from './artists'
import type { DatabaseBase } from './base'
import { playlists } from './playlists'
import { tracks } from './tracks'

export type Image = InferModel<typeof images>
export type InsertImage = InferModel<typeof images, 'insert'>
export const images = sqliteTable('images', {
  id: integer('id').primaryKey(),
  hash: text('hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type ImagesMixin = {
  images: {
    insert: (image: AutoCreatedAt<InsertImage>) => Image
    get: (id: Image['id']) => Image
    getNumberOfUses: (id: Image['id']) => number
    findHash: (hash: Image['hash']) => Image | undefined
    update: (id: Image['id'], data: UpdateData<InsertImage>) => Image
    delete: (id: Image['id']) => void
  }
}

export const ImagesMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ImagesMixin> & TBase =>
  class extends Base implements ImagesMixin {
    images: ImagesMixin['images'] = {
      insert: (image) => {
        return this.db.insert(images).values(withCreatedAt(image)).returning().get()
      },

      get: (id) => {
        return this.db.select().from(images).where(eq(images.id, id)).get()
      },

      getNumberOfUses: (id) => {
        return this.db
          .select({ id: images.id })
          .from(images)
          .where(eq(images.id, id))
          .innerJoin(tracks, eq(images.id, tracks.imageId))
          .innerJoin(playlists, eq(images.id, playlists.imageId))
          .innerJoin(artists, eq(images.id, artists.imageId))
          .all().length
      },

      findHash: (hash) => {
        return this.db.select().from(images).where(eq(images.hash, hash)).limit(1).all().at(0)
      },

      update: (id, data) => {
        return this.db
          .update(images)
          .set(makeUpdate(data))
          .where(eq(images.id, id))
          .returning()
          .get()
      },

      delete: (id) => {
        return this.db.delete(images).where(eq(images.id, id)).run()
      },
    }
  }
