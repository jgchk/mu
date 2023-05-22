import { withProps } from 'utils'

import type {
  DownloadService,
  SoulseekReleaseDownload,
  SoulseekReleaseDownloadsMixin,
  SoulseekTrackDownload,
  SoulseekTrackDownloadsMixin,
  SoundcloudPlaylistDownload,
  SoundcloudPlaylistDownloadsMixin,
  SoundcloudTrackDownload,
  SoundcloudTrackDownloadsMixin,
  SpotifyAlbumDownload,
  SpotifyAlbumDownloadsMixin,
  SpotifyTrackDownload,
  SpotifyTrackDownloadsMixin,
} from '.'

export type AllDownloadsMixin = {
  downloads: {
    getGroupDownload: (
      service: DownloadService,
      id: number
    ) => SoulseekReleaseDownload | SoundcloudPlaylistDownload | SpotifyAlbumDownload
    getGroupTrackDownloads: (
      service: DownloadService,
      id: number
    ) => (SoulseekTrackDownload | SoundcloudTrackDownload | SpotifyTrackDownload)[]
    getTrackDownload: (
      service: DownloadService,
      id: number
    ) => SoulseekTrackDownload | SoundcloudTrackDownload | SpotifyTrackDownload
    deleteGroupDownload: (service: DownloadService, id: number) => void
    deleteTrackDownload: (service: DownloadService, id: number) => void
  }
}

export const AllDownloadsMixin = <
  T extends SoulseekReleaseDownloadsMixin &
    SoulseekTrackDownloadsMixin &
    SoundcloudPlaylistDownloadsMixin &
    SoundcloudTrackDownloadsMixin &
    SpotifyAlbumDownloadsMixin &
    SpotifyTrackDownloadsMixin
>(
  base: T
): T & AllDownloadsMixin => {
  const allDownloadsMixin: AllDownloadsMixin['downloads'] = {
    getGroupDownload: (service, id) => {
      switch (service) {
        case 'soulseek':
          return base.soulseekReleaseDownloads.get(id)
        case 'soundcloud':
          return base.soundcloudPlaylistDownloads.get(id)
        case 'spotify':
          return base.spotifyAlbumDownloads.get(id)
      }
    },
    getGroupTrackDownloads: (service, id) => {
      switch (service) {
        case 'soulseek':
          return base.soulseekTrackDownloads.getByReleaseDownloadId(id)
        case 'soundcloud':
          return base.soundcloudTrackDownloads.getByPlaylistDownloadId(id)
        case 'spotify':
          return base.spotifyTrackDownloads.getByAlbumDownloadId(id)
      }
    },
    getTrackDownload: (service, id) => {
      switch (service) {
        case 'soulseek':
          return base.soulseekTrackDownloads.get(id)
        case 'soundcloud':
          return base.soundcloudTrackDownloads.get(id)
        case 'spotify':
          return base.spotifyTrackDownloads.get(id)
      }
    },
    deleteGroupDownload: (service, id) => {
      switch (service) {
        case 'soulseek':
          return base.soulseekReleaseDownloads.delete(id)
        case 'soundcloud':
          return base.soundcloudPlaylistDownloads.delete(id)
        case 'spotify':
          return base.spotifyAlbumDownloads.delete(id)
      }
    },
    deleteTrackDownload: (service, id) => {
      switch (service) {
        case 'soulseek':
          return base.soulseekTrackDownloads.delete(id)
        case 'soundcloud':
          return base.soundcloudTrackDownloads.delete(id)
        case 'spotify':
          return base.spotifyTrackDownloads.delete(id)
      }
    },
  }

  return withProps(base, { downloads: allDownloadsMixin })
}
