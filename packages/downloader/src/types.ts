import type { FullTrack as SoundcloudFullTrack, Playlist as SoundcloudPlaylist } from 'soundcloud';

type SoundcloudPlaylistDownload =
  | { stage: 'init'; id: number }
  | { stage: 'fetching-metadata'; id: number }
  | {
      stage: 'fetched-metadata';
      id: number;
      playlist: SoundcloudPlaylist;
      tracks: SoundcloudTrackDownload[];
    }
  | {
      stage: 'downloading';
      id: number;
      playlist: SoundcloudPlaylist;
      tracks: SoundcloudTrackDownload[];
    }
  | {
      stage: 'downloaded';
      id: number;
      playlist: SoundcloudPlaylist;
      tracks: SoundcloudTrackDownload[];
    };

type SoundcloudTrackDownload =
  | {
      stage: 'init';
      id: number;
    }
  | {
      stage: 'fetching-metadata';
      id: number;
    }
  | { stage: 'fetched-metadata'; id: number; track: SoundcloudFullTrack }
  | {
      stage: 'downloading';
      id: number;
      track: SoundcloudFullTrack;
      path: string;
      progress: number;
      complete: false;
    }
  | { stage: 'downloaded'; id: number; track: SoundcloudFullTrack; path: string; complete: true };
