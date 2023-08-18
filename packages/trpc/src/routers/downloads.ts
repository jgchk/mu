import type { DownloadStatus } from 'db'
import fs from 'fs'
import path from 'path'
import { compareDates, sum } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

const SoundcloudDownloadRequest = z.object({
  service: z.literal('soundcloud'),
  kind: z.enum(['track', 'playlist']),
  id: z.number(),
})

const SpotifyDownloadRequest = z.object({
  service: z.literal('spotify'),
  kind: z.enum(['track', 'album']),
  id: z.string(),
})

const SoulseekDownloadRequest = z
  .object({
    service: z.literal('soulseek'),
    kind: z.enum(['track']),
    username: z.string(),
    file: z.string(),
  })
  .or(
    z.object({
      service: z.literal('soulseek'),
      kind: z.enum(['tracks']),
      tracks: z
        .object({
          username: z.string(),
          file: z.string(),
        })
        .array(),
    })
  )

const DownloadRequest = z.union([
  SoundcloudDownloadRequest,
  SpotifyDownloadRequest,
  SoulseekDownloadRequest,
])

type GroupDownloadType = {
  service: 'soundcloud' | 'spotify' | 'soulseek'
  id: number
  name: string | undefined
  createdAt: Date
}
type TrackDownloadType = {
  service: 'soundcloud' | 'spotify' | 'soulseek'
  id: number
  parentId: number | undefined
  status: DownloadStatus
  progress: number | undefined
  error: unknown | undefined
  name: string | undefined
  createdAt: Date
}

export const downloadsRouter = router({
  download: protectedProcedure.input(DownloadRequest).mutation(({ input, ctx }) => {
    switch (input.service) {
      case 'soundcloud': {
        switch (input.kind) {
          case 'playlist': {
            const dbPlaylist =
              ctx.sys().db.soundcloudPlaylistDownloads.getByPlaylistId(input.id) ??
              ctx.sys().db.soundcloudPlaylistDownloads.insert({ playlistId: input.id })
            void ctx
              .sys()
              .dl.download({ service: 'soundcloud', type: 'playlist', dbId: dbPlaylist.id })
            return { id: dbPlaylist.id }
          }
          case 'track': {
            const dbTrack =
              ctx
                .sys()
                .db.soundcloudTrackDownloads.getByTrackIdAndPlaylistDownloadId(input.id, null) ??
              ctx.sys().db.soundcloudTrackDownloads.insert({ trackId: input.id, status: 'pending' })
            void ctx.sys().dl.download({ service: 'soundcloud', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
        }
      }
      case 'spotify': {
        switch (input.kind) {
          case 'album': {
            const dbAlbum =
              ctx.sys().db.spotifyAlbumDownloads.getByAlbumId(input.id) ??
              ctx.sys().db.spotifyAlbumDownloads.insert({ albumId: input.id })
            void ctx.sys().dl.download({ service: 'spotify', type: 'album', dbId: dbAlbum.id })
            return { id: dbAlbum.id }
          }
          case 'track': {
            const dbTrack =
              ctx.sys().db.spotifyTrackDownloads.getByTrackIdAndAlbumDownloadId(input.id, null) ??
              ctx.sys().db.spotifyTrackDownloads.insert({ trackId: input.id, status: 'pending' })
            void ctx.sys().dl.download({ service: 'spotify', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
        }
      }
      case 'soulseek': {
        switch (input.kind) {
          case 'track': {
            const dbTrack =
              ctx
                .sys()
                .db.soulseekTrackDownloads.getByUsernameAndFile(input.username, input.file) ??
              ctx.sys().db.soulseekTrackDownloads.insert({
                username: input.username,
                file: input.file,
                status: 'pending',
              })
            void ctx.sys().dl.download({ service: 'soulseek', type: 'track', dbId: dbTrack.id })
            return { id: dbTrack.id }
          }
          case 'tracks': {
            if (input.tracks.length === 0) {
              return []
            }

            const dirname = input.tracks[0].file
              .replaceAll('\\', '/')
              .split('/')
              .slice(0, -1)
              .reverse()
              .join('/')
            const dbRelease =
              ctx
                .sys()
                .db.soulseekReleaseDownloads.getByUsernameAndDir(
                  input.tracks[0].username,
                  dirname
                ) ??
              ctx.sys().db.soulseekReleaseDownloads.insert({
                username: input.tracks[0].username,
                dir: dirname,
              })
            const dbTracks = input.tracks.map(
              (track) =>
                ctx
                  .sys()
                  .db.soulseekTrackDownloads.getByUsernameAndFile(track.username, track.file) ??
                ctx.sys().db.soulseekTrackDownloads.insert({
                  username: track.username,
                  file: track.file,
                  releaseDownloadId: dbRelease.id,
                  status: 'pending',
                })
            )
            for (const dbTrack of dbTracks) {
              void ctx.sys().dl.download({ service: 'soulseek', type: 'track', dbId: dbTrack.id })
            }
            return dbTracks.map((dbTrack) => ({ id: dbTrack.id }))
          }
        }
      }
    }
  }),

  retryTrackDownload: protectedProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(({ input: { service, id }, ctx }) => {
      void ctx.sys().dl.download({ service, type: 'track', dbId: id })
    }),

  deleteTrackDownload: protectedProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const track = ctx.sys().db.downloads.getTrackDownload(input.service, input.id)
      if (track.path !== null) {
        await fs.promises.rm(path.resolve(track.path), { force: true })
      }
      ctx.sys().db.downloads.deleteTrackDownload(input.service, input.id)
      return { success: true }
    }),

  deleteGroupDownload: protectedProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const group = ctx.sys().db.downloads.getGroupDownload(input.service, input.id)
      const tracks = ctx.sys().db.downloads.getGroupTrackDownloads(input.service, group.id)

      await Promise.all(
        tracks.map(async (track) => {
          if (track.path !== null) {
            await fs.promises.rm(path.resolve(track.path), { force: true })
          }
          ctx.sys().db.downloads.deleteTrackDownload(input.service, track.id)
        })
      )

      ctx.sys().db.downloads.deleteGroupDownload(input.service, group.id)
      return { success: true }
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const [scPlaylists, scTracks, spAlbums, spTracks, slskReleases, slskTracks] = await Promise.all(
      [
        ctx
          .sys()
          .db.soundcloudPlaylistDownloads.getAll()
          .map(
            (playlist) =>
              ({
                service: 'soundcloud',
                id: playlist.id,
                name: playlist.playlist?.title,
                createdAt: playlist.createdAt,
              } as const)
          ),
        ctx
          .sys()
          .db.soundcloudTrackDownloads.getAll()
          .map(
            (track) =>
              ({
                service: 'soundcloud',
                id: track.id,
                parentId: track.playlistDownloadId,
                status: track.status,
                progress: track.progress,
                error: track.error,
                name: track.track?.title,
                createdAt: track.createdAt,
              } as const)
          ),
        ctx
          .sys()
          .db.spotifyAlbumDownloads.getAll()
          .map(
            (album) =>
              ({
                service: 'spotify',
                id: album.id,
                name: album.album?.name,
                createdAt: album.createdAt,
              } as const)
          ),
        ctx
          .sys()
          .db.spotifyTrackDownloads.getAll()
          .map(
            (track) =>
              ({
                service: 'spotify',
                id: track.id,
                parentId: track.albumDownloadId,
                status: track.status,
                progress: track.progress,
                error: track.error,
                name: track.track?.name,
                createdAt: track.createdAt,
              } as const)
          ),
        ctx
          .sys()
          .db.soulseekReleaseDownloads.getAll()
          .map(
            (release) =>
              ({
                service: 'soulseek',
                id: release.id,
                name: release.dir,
                createdAt: release.createdAt,
              } as const)
          ),
        ctx
          .sys()
          .db.soulseekTrackDownloads.getAll()
          .map(
            (track) =>
              ({
                service: 'soulseek',
                id: track.id,
                parentId: track.releaseDownloadId,
                status: track.status,
                progress: track.progress,
                error: track.error,
                filename: track.file,
                dirname: track.file
                  .replaceAll('\\', '/')
                  .split('/')
                  .slice(0, -1)
                  .reverse()
                  .join('/'),
                name: track.file.replaceAll('\\', '/').split('/').slice(-1)[0],
                createdAt: track.createdAt,
              } as const)
          ),
      ]
    )

    const rawData = {
      groups: [...scPlaylists, ...spAlbums, ...slskReleases],
      tracks: [...scTracks, ...spTracks, ...slskTracks],
    }

    const groupedData: {
      groups: { [id: string]: GroupDownloadType & { tracks: TrackDownloadType[] } }
      tracks: TrackDownloadType[]
    } = {
      groups: Object.fromEntries(
        rawData.groups.map((group) => [`${group.service}-${group.id}`, { ...group, tracks: [] }])
      ),
      tracks: [],
    }

    for (const track_ of rawData.tracks) {
      const track = {
        ...track_,
        parentId: track_.parentId ?? undefined,
        progress: track_.progress ?? undefined,
        error: track_.error ?? undefined,
      }
      if (track.parentId === undefined) {
        groupedData.tracks.push(track)
      } else {
        groupedData.groups[`${track.service}-${track.parentId}`].tracks.push(track)
      }
    }

    return {
      groups: Object.values(groupedData.groups)
        .map((group) => {
          const totalProgress = group.tracks.length * 100
          const currentProgress = sum(group.tracks.map((track) => track.progress ?? 0))
          const progress = Math.floor((currentProgress / totalProgress) * 100)

          return {
            ...group,
            progress,
          }
        })
        .sort((a, b) => {
          if (a.progress === 100) {
            return -1
          }
          if (b.progress === 100) {
            return 1
          }
          return compareDates(a.createdAt, b.createdAt)
        }),
      tracks: groupedData.tracks,
    }
  }),
})
