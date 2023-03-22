import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

const SoundcloudDownload = z.object({
  service: z.literal('soundcloud'),
  kind: z.enum(['track', 'playlist']),
  id: z.number(),
})

const SpotifyDownload = z.object({
  service: z.literal('spotify'),
  kind: z.enum(['track', 'album']),
  id: z.string(),
})

const SoulseekDownload = z.object({
  service: z.literal('soulseek'),
  kind: z.enum(['track']),
  username: z.string(),
  file: z.string(),
})

const DownloadRequest = z.union([SoundcloudDownload, SpotifyDownload, SoulseekDownload])

export const downloadsRouter = router({
  download: publicProcedure.input(DownloadRequest).mutation(({ input, ctx }) => {
    switch (input.service) {
      case 'soundcloud': {
        switch (input.kind) {
          case 'playlist': {
            const dbPlaylist =
              ctx.db.soundcloudPlaylistDownloads.getByPlaylistId(input.id) ??
              ctx.db.soundcloudPlaylistDownloads.insert({ playlistId: input.id })
            void ctx.dl.queue({ service: 'soundcloud', type: 'playlist', dbId: dbPlaylist.id })
            return { id: dbPlaylist.id }
          }
          case 'track': {
            const dbTrack =
              ctx.db.soundcloudTrackDownloads.getByTrackIdAndPlaylistDownloadId(input.id, null) ??
              ctx.db.soundcloudTrackDownloads.insert({ trackId: input.id })
            void ctx.dl.queue({ service: 'soundcloud', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
        }
      }
      case 'spotify': {
        switch (input.kind) {
          case 'album': {
            const dbAlbum =
              ctx.db.spotifyAlbumDownloads.getByAlbumId(input.id) ??
              ctx.db.spotifyAlbumDownloads.insert({ albumId: input.id })
            void ctx.dl.queue({ service: 'spotify', type: 'album', dbId: dbAlbum.id })
            return { id: dbAlbum.id }
          }
          case 'track': {
            const dbTrack =
              ctx.db.spotifyTrackDownloads.getByTrackIdAndAlbumDownloadId(input.id, null) ??
              ctx.db.spotifyTrackDownloads.insert({ trackId: input.id })
            void ctx.dl.queue({ service: 'spotify', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
        }
      }
      case 'soulseek': {
        switch (input.kind) {
          case 'track': {
            const dbTrack =
              ctx.db.soulseekTrackDownloads.getByUsernameAndFile(input.username, input.file) ??
              ctx.db.soulseekTrackDownloads.insert({
                username: input.username,
                file: input.file,
              })
            void ctx.dl.queue({ service: 'soulseek', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
        }
      }
    }
  }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const [scPlaylists, scTracks, spAlbums, spTracks, slskTracks] = await Promise.all([
      ctx.db.soundcloudPlaylistDownloads.getAll().map(
        (playlist) =>
          ({
            service: 'soundcloud',
            id: playlist.id,
            name: playlist.playlist?.title,
          } as const)
      ),
      ctx.db.soundcloudTrackDownloads.getAll().map(
        (track) =>
          ({
            service: 'soundcloud',
            id: track.id,
            parentId: track.playlistDownloadId !== null ? track.playlistDownloadId : null,
            progress: track.progress,
            name: track.track?.title,
          } as const)
      ),
      ctx.db.spotifyAlbumDownloads.getAll().map(
        (album) =>
          ({
            service: 'spotify',
            id: album.id,
            name: album.album?.name,
          } as const)
      ),
      ctx.db.spotifyTrackDownloads.getAll().map(
        (track) =>
          ({
            service: 'spotify',
            id: track.id,
            parentId: track.albumDownloadId !== null ? track.albumDownloadId : null,
            progress: track.progress,
            name: track.track?.name,
          } as const)
      ),
      ctx.db.soulseekTrackDownloads.getAll().map(
        (track) =>
          ({
            service: 'soulseek',
            id: track.id,
            parentId: null,
            progress: track.progress,
            name: track.file,
          } as const)
      ),
    ])
    return {
      groups: [...scPlaylists, ...spAlbums],
      tracks: [...scTracks, ...spTracks, ...slskTracks],
    }
  }),
})
