import { eq, isNotNull, isNull } from 'drizzle-orm'
import { withProps } from 'utils'

import type { InsertPlaylist, Playlist } from '../schema/playlists'
import { playlists } from '../schema/playlists'
import type { AutoCreatedAt, UpdateData } from '../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'

export type PlaylistsMixin = {
  playlists: {
    insert: (playlist: AutoCreatedAt<InsertPlaylist>) => Playlist
    get: (id: Playlist['id']) => Playlist | undefined
    getAll: (filter?: { auto?: boolean }) => Playlist[]
    update: (id: Playlist['id'], data: UpdateData<InsertPlaylist>) => Playlist | undefined
    delete: (id: Playlist['id']) => void
  }
}

export const PlaylistsMixin = <T extends DatabaseBase>(base: T): T & PlaylistsMixin => {
  const playlistsMixin: PlaylistsMixin['playlists'] = {
    insert: (playlist) => {
      return base.db.insert(playlists).values(withCreatedAt(playlist)).returning().get()
    },

    get: (id) => {
      return base.db.select().from(playlists).where(eq(playlists.id, id)).get()
    },

    getAll: (filter) => {
      let query = base.db.select().from(playlists).orderBy(playlists.name)

      if (filter?.auto !== undefined) {
        query = query.where(filter.auto ? isNotNull(playlists.filter) : isNull(playlists.filter))
      }

      return query.all()
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return playlistsMixin.get(id)
      return base.db.update(playlists).set(update).where(eq(playlists.id, id)).returning().get()
    },

    delete: (id) => {
      return base.db.delete(playlists).where(eq(playlists.id, id)).run()
    },
  }

  return withProps(base, { playlists: playlistsMixin })
}
