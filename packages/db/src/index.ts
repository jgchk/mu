import { pipe } from 'utils'

import { AccountsMixin } from './helpers/accounts'
import { ArtistsMixin } from './helpers/artists'
import { DatabaseBase } from './helpers/base'
import { ConfigMixin } from './helpers/config'
import { AllDownloadsMixin } from './helpers/downloads/all'
import { SoulseekReleaseDownloadsMixin } from './helpers/downloads/soulseek-release-downloads'
import { SoulseekTrackDownloadsMixin } from './helpers/downloads/soulseek-track-downloads'
import { SoundcloudPlaylistDownloadsMixin } from './helpers/downloads/soundcloud-playlist-downloads'
import { SoundcloudTrackDownloadsMixin } from './helpers/downloads/soundcloud-track-downloads'
import { SpotifyAlbumDownloadsMixin } from './helpers/downloads/spotify-album-downloads'
import { SpotifyTrackDownloadsMixin } from './helpers/downloads/spotify-track-downloads'
import { ImagesMixin } from './helpers/images'
import { PlaylistTracksMixin } from './helpers/playlist-tracks'
import { PlaylistsMixin } from './helpers/playlists'
import { ReleaseArtistsMixin } from './helpers/release-artists'
import { ReleaseTagsMixin } from './helpers/release-tags'
import { ReleasesMixin } from './helpers/releases'
import { SessionsMixin } from './helpers/sessions'
import { TagsMixin } from './helpers/tags'
import { TrackArtistsMixin } from './helpers/track-artists'
import { TrackTagsMixin } from './helpers/track-tags'
import { TracksMixin } from './helpers/tracks'

export * from './schema'
export * from 'drizzle-orm'

export const Database = (url: string, log = false) => {
  const base = new DatabaseBase(url, log)
  return pipe(
    base,
    AccountsMixin,
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
