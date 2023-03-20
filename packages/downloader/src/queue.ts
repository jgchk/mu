import { randomInt } from 'crypto';
import {
  insertReleaseDownload,
  insertTrackDownload,
  updateReleaseDownload,
  updateTrackDownload
} from 'db';
import fastq from 'fastq';
import fs from 'fs';
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata';
import path from 'path';
import type { FullTrack as SoundcloudFullTrack } from 'soundcloud';
import { downloadTrack, getLargestAvailableImage, getPlaylist, getTrack } from 'soundcloud';
import type { SimplifiedTrack as SpotifySimplifiedTrack } from 'spotify';
import {
  downloadSpotifyTrack,
  getSpotifyAlbum,
  getSpotifyAlbumTracks,
  getSpotifyTrack
} from 'spotify';

import { env } from './env';
import { ifNotNull } from './utils/types';

export type SoundcloudTrackDownload = {
  service: 'soundcloud';
  kind: 'track';
  id: number;
};
export type SoundcloudPlaylistDownload = {
  service: 'soundcloud';
  kind: 'playlist';
  id: number;
};

export type SpotifyTrackDownload = {
  service: 'spotify';
  kind: 'track';
  id: string;
};
export type SpotifyAlbumDownload = {
  service: 'spotify';
  kind: 'album';
  id: string;
};

export type Task = MetadataTask | DownloadTrackTask;
export type MetadataTask = {
  task: 'metadata';
  input:
    | SoundcloudTrackDownload
    | SoundcloudPlaylistDownload
    | SpotifyTrackDownload
    | SpotifyAlbumDownload;
};
export type DownloadTrackTask = {
  task: 'download-track';
  input:
    | {
        service: 'soundcloud';
        track: SoundcloudFullTrack;
        dbId: number;
      }
    | { service: 'spotify'; track: SpotifySimplifiedTrack; dbId: number };
};

export const q: fastq.queueAsPromised<Task> = fastq.promise(worker, 1);

q.error((err, task) => {
  if (err) {
    console.error('ERROR', err, task);
  }
});

async function worker(task: Task) {
  const newTasks = await runTask(task);
  for (const newTask of newTasks) {
    void q.push(newTask);
  }
}

async function runTask(task: Task): Promise<Task[]> {
  switch (task.task) {
    case 'metadata':
      return runMetadata(task);
    case 'download-track':
      return runDownloadTrack(task);
  }
}

async function runMetadata(task: MetadataTask): Promise<Task[]> {
  switch (task.input.service) {
    case 'soundcloud': {
      switch (task.input.kind) {
        case 'track': {
          const trackDownload = insertTrackDownload({ complete: false });
          const track = await getTrack(task.input.id);
          updateTrackDownload(trackDownload.id, { name: track.title });
          return [
            {
              task: 'download-track',
              input: { service: 'soundcloud', track, dbId: trackDownload.id }
            }
          ];
        }
        case 'playlist': {
          const releaseDownload = insertReleaseDownload({ name: 'yo' });
          const playlist = await getPlaylist(task.input.id);
          updateReleaseDownload(releaseDownload.id, { name: playlist.title });
          const tracks = await Promise.all(
            playlist.tracks.map(async (track) => {
              if ('title' in track) {
                const trackDownload = insertTrackDownload({
                  complete: false,
                  releaseDownloadId: releaseDownload.id,
                  name: track.title
                });
                return { track, dbId: trackDownload.id };
              } else {
                const trackDownload = insertTrackDownload({
                  complete: false,
                  releaseDownloadId: releaseDownload.id
                });
                const fullTrack = await getTrack(track.id);
                updateTrackDownload(trackDownload.id, { name: fullTrack.title });
                return { track: fullTrack, dbId: trackDownload.id };
              }
            })
          );
          return tracks.map(({ track, dbId }) => ({
            task: 'download-track',
            input: { service: 'soundcloud', track, dbId }
          }));
        }
      }
    }
    case 'spotify': {
      switch (task.input.kind) {
        case 'track': {
          const trackDownload = insertTrackDownload({ complete: false });
          const track = await getSpotifyTrack(task.input.id);
          updateTrackDownload(trackDownload.id, { name: track.name });
          return [
            { task: 'download-track', input: { service: 'spotify', track, dbId: trackDownload.id } }
          ];
        }
        case 'album': {
          const releaseDownload = insertReleaseDownload({});
          const album = await getSpotifyAlbum(task.input.id);
          updateTrackDownload(releaseDownload.id, { name: album.name });

          const tracks = await getSpotifyAlbumTracks(task.input.id);
          return tracks.map((track) => {
            const trackDownload = insertTrackDownload({
              complete: false,
              releaseDownloadId: releaseDownload.id,
              name: track.name
            });
            return {
              task: 'download-track',
              input: { service: 'spotify', track, dbId: trackDownload.id }
            };
          });
        }
      }
    }
  }
}

const runDownloadTrack = async (task: DownloadTrackTask): Promise<Task[]> => {
  switch (task.input.service) {
    case 'soundcloud': {
      const { pipe: dlPipe, extension } = await downloadTrack(task.input.track);

      const fileName = `sc-${task.input.track.id}-${Date.now()}-${randomInt(0, 10)}.${extension}`;
      const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      const fsPipe = fs.createWriteStream(filePath);
      dlPipe.pipe(fsPipe);

      await new Promise((resolve) => {
        dlPipe.on('close', resolve);
      });

      const artwork = await ifNotNull(task.input.track.artwork_url, (artworkUrl) =>
        getLargestAvailableImage(artworkUrl)
      );

      const { artists, title } = parseArtistTitle(task.input.track.title);
      await writeTrackMetadata(filePath, {
        title,
        artists: artists ?? [task.input.track.user.username],
        album: title,
        albumArtists: artists ?? [task.input.track.user.username],
        trackNumber: '1'
      });
      if (artwork) {
        await writeTrackCoverArt(filePath, artwork);
      }

      updateTrackDownload(task.input.dbId, { complete: true, path: filePath });

      return [];
    }
    case 'spotify': {
      const fileName = `spot-${task.input.track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`;
      const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      const fsPipe = fs.createWriteStream(filePath);

      const pipe = downloadSpotifyTrack(task.input.track.id);
      pipe.pipe(fsPipe);

      await new Promise((resolve) => {
        pipe.on('close', resolve);
      });

      updateTrackDownload(task.input.dbId, { complete: true, path: filePath });

      return [];
    }
  }
};
