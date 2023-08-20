export * from './soulseek-release-downloads'
export * from './soulseek-track-downloads'
export * from './soundcloud-playlist-downloads'
export * from './soundcloud-track-downloads'
export * from './spotify-album-downloads'
export * from './spotify-track-downloads'

export type DownloadService = 'soundcloud' | 'spotify' | 'soulseek'
export type DownloadStatus = 'pending' | 'downloading' | 'done' | 'error'
