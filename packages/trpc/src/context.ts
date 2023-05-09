import type { Database } from 'db'
import type { Download } from 'downloader'
import type { ImageManager } from 'image-manager'
import type { LastFM, LastFMAuthenticated } from 'last-fm'
import type {
  FormattedLastFmStatus,
  FormattedSoulseekStatus,
  FormattedSoundcloudStatus,
  FormattedSpotifyStatus,
  FormattedStatus,
} from 'services'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { FriendActivityEnabled } from 'spotify/src/features/friends'
import type { WebApiEnabled } from 'spotify/src/features/web-api'

export type Context = {
  db: Database
  img: ImageManager
  imagesDir: string
  musicDir: string

  getStatus: () => Promise<FormattedStatus>

  startSoulseek: () => Promise<FormattedSoulseekStatus>
  stopSoulseek: () => Promise<FormattedSoulseekStatus>

  startLastFm: () => Promise<FormattedLastFmStatus>
  stopLastFm: () => Promise<FormattedLastFmStatus>

  startSpotify: () => Promise<FormattedSpotifyStatus>
  stopSpotify: () => Promise<FormattedSpotifyStatus>

  startSoundcloud: () => Promise<FormattedSoundcloudStatus>
  stopSoundcloud: () => Promise<FormattedSoundcloudStatus>

  download: (dl: Download) => Promise<void>

  lfm: {
    getFriends: LastFMAuthenticated['getFriends']
    getRecentTracks: LastFM['getRecentTracks']
    getLovedTrack: LastFMAuthenticated['getLovedTrack']
    updateNowPlaying: LastFMAuthenticated['updateNowPlaying']
    scrobble: LastFMAuthenticated['scrobble']
    loveTrack: LastFMAuthenticated['loveTrack']
    unloveTrack: LastFMAuthenticated['unloveTrack']
  }

  sc: {
    searchTracks: Soundcloud['searchTracks']
    searchAlbums: Soundcloud['searchAlbums']
  }

  slsk: {
    search: SlskClient['search']
  }

  sp: {
    getFriendActivity: FriendActivityEnabled['getFriendActivity']
    search: WebApiEnabled['search']
  }

  destroy: () => Promise<void>
}
