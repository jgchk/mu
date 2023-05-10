import type { BoolLang } from 'bool-lang'
import { decode } from 'bool-lang'
import type { Context } from 'context'
import type { Database } from 'db'
import { toErrorString } from 'utils'
import { z } from 'zod'

export const BoolLangString = z.string().transform((val, ctx) => {
  try {
    const parsed = decode(val)
    return parsed
  } catch (e) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid BoolLang: ${toErrorString(e)}`,
    })
    return z.NEVER
  }
})

export type SortDirection = z.infer<typeof SortDirection>
export const SortDirection = z.enum(['asc', 'desc'])

export type TracksSortColumn = z.infer<typeof TracksSortColumn>
export const TracksSortColumn = z.enum(['title', 'artists', 'release', 'duration'])

export type TracksSort = z.infer<typeof TracksSort>
export const TracksSort = z.object({
  column: TracksSortColumn,
  direction: SortDirection,
})

export type TracksFilter = z.infer<typeof TracksFilter>
export const TracksFilter = z.object({
  favorite: z.boolean().optional(),
  tags: BoolLangString.optional(),
  sort: TracksSort.optional(),
  limit: z.number().min(1).max(100).optional(),
  cursor: z.number().optional(),
})

export const injectDescendants =
  (db: Context['db']) =>
  (node: BoolLang): BoolLang => {
    switch (node.kind) {
      case 'id': {
        const descendants = db.tags.getDescendants(node.value)
        const ids = [node.value, ...descendants.map((t) => t.id)]
        return {
          kind: 'or',
          children: ids.map((id) => ({ kind: 'id', value: id })),
        }
      }
      case 'not': {
        return {
          kind: 'not',
          child: injectDescendants(db)(node.child),
        }
      }
      case 'and': {
        return {
          kind: 'and',
          children: node.children.map(injectDescendants(db)),
        }
      }
      case 'or': {
        return {
          kind: 'or',
          children: node.children.map(injectDescendants(db)),
        }
      }
    }
  }

export type DownloadService = 'soundcloud' | 'spotify' | 'soulseek'

export const getGroupDownload = (db: Database, service: DownloadService, id: number) => {
  switch (service) {
    case 'soundcloud':
      return db.soundcloudPlaylistDownloads.get(id)
    case 'spotify':
      return db.spotifyAlbumDownloads.get(id)
    case 'soulseek':
      return db.soulseekReleaseDownloads.get(id)
  }
}

export const getGroupTrackDownloads = (
  db: Database,
  service: 'soundcloud' | 'spotify' | 'soulseek',
  groupId: number
) => {
  switch (service) {
    case 'soundcloud':
      return db.soundcloudTrackDownloads.getByPlaylistDownloadId(groupId)
    case 'spotify':
      return db.spotifyTrackDownloads.getByAlbumDownloadId(groupId)
    case 'soulseek':
      return db.soulseekTrackDownloads.getByReleaseDownloadId(groupId)
  }
}

export const getTrackDownload = (db: Database, service: DownloadService, id: number) => {
  switch (service) {
    case 'soundcloud':
      return db.soundcloudTrackDownloads.get(id)
    case 'spotify':
      return db.spotifyTrackDownloads.get(id)
    case 'soulseek':
      return db.soulseekTrackDownloads.get(id)
  }
}

export const deleteGroupDownload = (db: Database, service: DownloadService, id: number) => {
  switch (service) {
    case 'soundcloud':
      return db.soundcloudPlaylistDownloads.delete(id)
    case 'spotify':
      return db.spotifyAlbumDownloads.delete(id)
    case 'soulseek':
      return db.soulseekReleaseDownloads.delete(id)
  }
}

export const deleteTrackDownload = (db: Database, service: DownloadService, id: number) => {
  switch (service) {
    case 'soundcloud':
      return db.soundcloudTrackDownloads.delete(id)
    case 'spotify':
      return db.spotifyTrackDownloads.delete(id)
    case 'soulseek':
      return db.soulseekTrackDownloads.delete(id)
  }
}
