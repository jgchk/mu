import { pipe } from 'utils'

import { ConfigMixin, ImagesMixin, SoulseekReleaseDownloadsMixin } from './schema'
import { ArtistsMixin } from './schema/artists'
import { DatabaseBase } from './schema/base'
import { SoulseekTrackDownloadsMixin } from './schema/downloads/soulseek-track-downloads'
import { SoundcloudPlaylistDownloadsMixin } from './schema/downloads/soundcloud-playlist-downloads'
import { SoundcloudTrackDownloadsMixin } from './schema/downloads/soundcloud-track-downloads'
import { SpotifyAlbumDownloadsMixin } from './schema/downloads/spotify-album-downloads'
import { SpotifyTrackDownloadsMixin } from './schema/downloads/spotify-track-downloads'
import { PlaylistTracksMixin } from './schema/playlist-tracks'
import { PlaylistsMixin } from './schema/playlists'
import { ReleaseArtistsMixin } from './schema/release-artists'
import { ReleasesMixin } from './schema/releases'
import { TrackArtistsMixin } from './schema/track-artists'
import { TracksMixin } from './schema/tracks'

export * from './schema'

const DatabaseClass = pipe(
  DatabaseBase,
  ConfigMixin,
  ImagesMixin,
  ArtistsMixin,
  ReleaseArtistsMixin,
  ReleasesMixin,
  TrackArtistsMixin,
  TracksMixin,
  PlaylistsMixin,
  PlaylistTracksMixin,
  SoundcloudPlaylistDownloadsMixin,
  SoundcloudTrackDownloadsMixin,
  SpotifyAlbumDownloadsMixin,
  SpotifyTrackDownloadsMixin,
  SoulseekReleaseDownloadsMixin,
  SoulseekTrackDownloadsMixin
)

export const Database = (url: string) => new DatabaseClass(url)

export type Database = ReturnType<typeof Database>
