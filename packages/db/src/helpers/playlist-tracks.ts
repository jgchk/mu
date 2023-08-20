import { and, desc, eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type { InsertPlaylistTrack, PlaylistTrack } from '../schema/playlist-tracks'
import { playlistTracks } from '../schema/playlist-tracks'
import type { AutoCreatedAt, UpdateData } from '../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'

export type PlaylistTracksMixin = {
  playlistTracks: {
    get: (id: PlaylistTrack['id']) => PlaylistTrack | undefined
    insert: (playlistTrack: AutoCreatedAt<InsertPlaylistTrack>) => PlaylistTrack
    insertMany: (playlistTracks: AutoCreatedAt<InsertPlaylistTrack>[]) => PlaylistTrack[]
    insertManyByPlaylistId: (
      playlistId: PlaylistTrack['playlistId'],
      trackIds: PlaylistTrack['trackId'][]
    ) => PlaylistTrack[]
    update: (
      id: PlaylistTrack['id'],
      data: UpdateData<InsertPlaylistTrack>
    ) => PlaylistTrack | undefined
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

export const PlaylistTracksMixin = <T extends DatabaseBase>(base: T): T & PlaylistTracksMixin => {
  const playlistTracksMixin: PlaylistTracksMixin['playlistTracks'] = {
    get: (id) => {
      return base.db.select().from(playlistTracks).where(eq(playlistTracks.id, id)).get()
    },

    insert: (playlistTrack) => {
      return base.db.insert(playlistTracks).values(withCreatedAt(playlistTrack)).returning().get()
    },

    insertMany: (playlistTracks_) => {
      if (playlistTracks_.length === 0) return []
      return base.db
        .insert(playlistTracks)
        .values(playlistTracks_.map(withCreatedAt))
        .returning()
        .all()
    },

    insertManyByPlaylistId: (playlistId, trackIds) => {
      return playlistTracksMixin.insertMany(
        trackIds.map((trackId, order) => ({
          playlistId,
          trackId,
          order,
        }))
      )
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return playlistTracksMixin.get(id)
      return base.db
        .update(playlistTracks)
        .set(update)
        .where(eq(playlistTracks.id, id))
        .returning()
        .get()
    },

    updateByPlaylistId: (playlistId, trackIds) => {
      playlistTracksMixin.deleteByPlaylistId(playlistId)
      return playlistTracksMixin.insertManyByPlaylistId(playlistId, trackIds)
    },

    addTrack: (playlistId, trackId) => {
      const lastTrack = base.db
        .select({ order: playlistTracks.order })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, playlistId))
        .orderBy(desc(playlistTracks.order))
        .limit(1)
        .all()
        .at(0)
      const order = lastTrack ? lastTrack.order + 1 : 0
      return playlistTracksMixin.insert({ playlistId, trackId, order })
    },

    find: (playlistId, trackId) => {
      return base.db
        .select()
        .from(playlistTracks)
        .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
        .limit(1)
        .all()
        .at(0)
    },

    delete: (id) => {
      return base.db.delete(playlistTracks).where(eq(playlistTracks.id, id)).run()
    },

    deleteByPlaylistId: (playlistId) => {
      return base.db.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId)).run()
    },
  }

  return withProps(base, { playlistTracks: playlistTracksMixin })
}
