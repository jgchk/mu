import type { RouterOutput } from '$lib/trpc';

export type Downloads = RouterOutput['downloads']['getAll'];
export type ReleaseDownload = Downloads['releases'][number];
export type TrackDownload = Downloads['tracks'][number];
export type SoundcloudPlaylistDownload = Downloads['scPlaylists'][number];
export type SoundcloudTrackDownload = Downloads['scTracks'][number];
