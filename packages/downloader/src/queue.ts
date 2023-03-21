import { randomInt } from 'crypto';
import type { Database } from 'db';
import fastq from 'fastq';
import fs from 'fs';
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata';
import path from 'path';
import type { FullTrack as SoundcloudFullTrack } from 'soundcloud';
import { Soundcloud } from 'soundcloud';
import type { SimplifiedTrack as SpotifySimplifiedTrack, Spotify } from 'spotify';

import { fileExists } from './utils/fs';
import { ifNotNull } from './utils/types';

export type SoundcloudTrackDownload = {
  service: 'soundcloud';
  kind: 'track';
  id: number;
  dbId?: number;
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
  dbId?: number;
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

export class DownloadQueue {
  private q: fastq.queueAsPromised<Task>;
  private db: Database;
  private sc: Soundcloud;
  private sp: Spotify;
  private downloadDir: string;

  constructor({
    db,
    sc,
    sp,
    downloadDir
  }: {
    db: Database;
    sc: Soundcloud;
    sp: Spotify;
    downloadDir: string;
  }) {
    this.db = db;
    this.sc = sc;
    this.sp = sp;
    this.downloadDir = downloadDir;
    this.q = fastq.promise(this.worker.bind(this), 1);
    this.q.error((err, task) => {
      if (err) {
        console.error('ERROR', err, task);
      }
    });
  }

  queue(dl: MetadataTask['input']) {
    return this.q.push({ task: 'metadata', input: dl });
  }

  close() {
    this.q.kill();
  }

  private async worker(task: Task) {
    const newTasks = await this.runTask(task);
    for (const newTask of newTasks) {
      void this.q.push(newTask);
    }
  }

  async runTask(task: Task): Promise<Task[]> {
    switch (task.task) {
      case 'metadata':
        return this.runMetadata(task);
      case 'download-track':
        return this.runDownloadTrack(task);
    }
  }

  async runMetadata(task: MetadataTask): Promise<Task[]> {
    switch (task.input.service) {
      case 'soundcloud': {
        switch (task.input.kind) {
          case 'track': {
            const downloadId =
              task.input.dbId ??
              this.db.trackDownloads.insert({
                service: task.input.service,
                serviceId: task.input.id,
                complete: false
              }).id;
            const track = await this.sc.getTrack(task.input.id);
            this.db.trackDownloads.update(downloadId, { name: track.title });
            return [
              {
                task: 'download-track',
                input: { service: 'soundcloud', track, dbId: downloadId }
              }
            ];
          }
          case 'playlist': {
            const releaseDownload = this.db.releaseDownloads.insert({ name: 'yo' });
            const playlist = await this.sc.getPlaylist(task.input.id);
            this.db.releaseDownloads.update(releaseDownload.id, { name: playlist.title });
            const tracks = await Promise.all(
              playlist.tracks.map(async (track) => {
                if ('title' in track) {
                  const trackDownload = this.db.trackDownloads.insert({
                    service: task.input.service,
                    serviceId: track.id,
                    complete: false,
                    releaseDownloadId: releaseDownload.id,
                    name: track.title
                  });
                  return { track, dbId: trackDownload.id };
                } else {
                  const trackDownload = this.db.trackDownloads.insert({
                    service: task.input.service,
                    serviceId: track.id,
                    complete: false,
                    releaseDownloadId: releaseDownload.id
                  });
                  const fullTrack = await this.sc.getTrack(track.id);
                  this.db.trackDownloads.update(trackDownload.id, { name: fullTrack.title });
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
            const downloadId =
              task.input.dbId ??
              this.db.trackDownloads.insert({
                service: task.input.service,
                serviceId: task.input.id,
                complete: false
              }).id;
            const track = await this.sp.getTrack(task.input.id);
            this.db.trackDownloads.update(downloadId, { name: track.name });
            return [
              {
                task: 'download-track',
                input: { service: 'spotify', track, dbId: downloadId }
              }
            ];
          }
          case 'album': {
            const releaseDownload = this.db.releaseDownloads.insert({});
            const album = await this.sp.getAlbum(task.input.id);
            this.db.releaseDownloads.update(releaseDownload.id, { name: album.name });

            const tracks = await this.sp.getAlbumTracks(task.input.id);
            return tracks.map((track) => {
              const trackDownload = this.db.trackDownloads.insert({
                service: task.input.service,
                serviceId: track.id,
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

  runDownloadTrack = async (task: DownloadTrackTask): Promise<Task[]> => {
    switch (task.input.service) {
      case 'soundcloud': {
        const { pipe: dlPipe, extension } = await this.sc.downloadTrack(task.input.track);

        const fileName = `sc-${task.input.track.id}-${Date.now()}-${randomInt(0, 10)}.${extension}`;
        const filePath = path.resolve(path.join(this.downloadDir, fileName));

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        const alreadyExists = await fileExists(filePath);
        if (alreadyExists) {
          await fs.promises.rm(filePath);
        }

        const fsPipe = fs.createWriteStream(filePath);
        dlPipe.pipe(fsPipe);

        await new Promise((resolve) => {
          dlPipe.on('close', resolve);
        });

        const artwork = await ifNotNull(task.input.track.artwork_url, (artworkUrl) =>
          Soundcloud.getLargestAvailableImage(artworkUrl)
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

        this.db.trackDownloads.update(task.input.dbId, { complete: true, path: filePath });

        return [];
      }
      case 'spotify': {
        const fileName = `spot-${task.input.track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`;
        const filePath = path.resolve(path.join(this.downloadDir, fileName));

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        const alreadyExists = await fileExists(filePath);
        if (alreadyExists) {
          await fs.promises.rm(filePath);
        }

        const fsPipe = fs.createWriteStream(filePath);
        const pipe = this.sp.downloadTrack(task.input.track.id);
        pipe.pipe(fsPipe);

        await new Promise((resolve) => {
          pipe.on('close', resolve);
        });

        this.db.trackDownloads.update(task.input.dbId, { complete: true, path: filePath });

        return [];
      }
    }
  };
}
