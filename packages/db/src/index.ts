import { pipe } from 'utils'

import {
  AllDownloadsMixin,
  ConfigMixin,
  ImagesMixin,
  SessionsMixin,
  SoulseekReleaseDownloadsMixin,
  TrackTagsMixin,
} from './schema'
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
import { ReleaseTagsMixin } from './schema/release-tags'
import { ReleasesMixin } from './schema/releases'
import { TagsMixin } from './schema/tags'
import { TrackArtistsMixin } from './schema/track-artists'
import { TracksMixin } from './schema/tracks'

export * from './schema'
export * from 'drizzle-orm'

export const Database = (url: string) => {
  const base = new DatabaseBase(url)
  return pipe(
    base,
    ArtistsMixin,
    ConfigMixin,
    ImagesMixin,
    PlaylistsMixin,
    PlaylistTracksMixin,
    ReleaseArtistsMixin,
    ReleasesMixin,
    ReleaseTagsMixin,
    SessionsMixin,
    TagsMixin,
    TrackArtistsMixin,
    TracksMixin,
    TrackTagsMixin,
    (s) =>
      pipe(
        s,
        SoulseekReleaseDownloadsMixin,
        SoulseekTrackDownloadsMixin,
        SoundcloudPlaylistDownloadsMixin,
        SoundcloudTrackDownloadsMixin,
        SpotifyAlbumDownloadsMixin,
        SpotifyTrackDownloadsMixin,
        AllDownloadsMixin
      )
  )
}

export type Database = ReturnType<typeof Database>
