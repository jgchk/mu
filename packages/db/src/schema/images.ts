import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../utils'
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
    get: (id: Image['id']) => Image | undefined
    getNumberOfUses: (id: Image['id']) => number
    findHash: (hash: Image['hash']) => Image | undefined
    update: (id: Image['id'], data: UpdateData<InsertImage>) => Image | undefined
    delete: (id: Image['id']) => void
  }
}

export const ImagesMixin = <T extends DatabaseBase>(base: T): T & ImagesMixin => {
  const imagesMixin: ImagesMixin['images'] = {
    insert: (image) => {
      return base.db.insert(images).values(withCreatedAt(image)).returning().get()
    },

    get: (id) => {
      return base.db.select().from(images).where(eq(images.id, id)).get()
    },

    getNumberOfUses: (id) => {
      const tracks_ = base.db
        .select({ id: tracks.id })
        .from(tracks)
        .where(eq(tracks.imageId, id))
        .all().length
      const artists_ = base.db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.imageId, id))
        .all().length
      const playlists_ = base.db
        .select({ id: playlists.id })
        .from(playlists)
        .where(eq(playlists.imageId, id))
        .all().length
      return tracks_ + artists_ + playlists_
    },

    findHash: (hash) => {
      return base.db.select().from(images).where(eq(images.hash, hash)).limit(1).all().at(0)
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return imagesMixin.get(id)
      return base.db.update(images).set(update).where(eq(images.id, id)).returning().get()
    },

    delete: (id) => {
      return base.db.delete(images).where(eq(images.id, id)).run()
    },
  }

  return withProps(base, { images: imagesMixin })
}
