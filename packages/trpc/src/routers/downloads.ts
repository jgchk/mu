import { randomInt } from 'crypto';
import {
  getAllReleaseDownloads,
  getAllTrackDownloads,
  insertReleaseDownload,
  insertTrackDownload,
  updateTrackDownload
} from 'db';
import fs from 'fs';
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata';
import path from 'path';
import { downloadTrack, getLargestAvailableImage, getPlaylist, getTrack } from 'soundcloud';
import {
  downloadSpotifyTrack,
  getSpotifyAlbum,
  getSpotifyAlbumTracks,
  getSpotifyTrack
} from 'spotify';
import { z } from 'zod';

import { env } from '../env';
import { publicProcedure, router } from '../trpc';
import { ifNotNull } from '../utils/types';

const SoundcloudDownload = z.object({
  service: z.literal('soundcloud'),
  id: z.number(),
  kind: z.enum(['track', 'playlist'])
});

const SpotifyDownload = z.object({
  service: z.literal('spotify'),
  id: z.string(),
  kind: z.enum(['track', 'album'])
});

const DownloadRequest = z.union([SoundcloudDownload, SpotifyDownload]);

export const downloadsRouter = router({
  download: publicProcedure.input(DownloadRequest).mutation(async ({ input }) => {
    if (input.service === 'spotify') {
      const { kind, id } = input;
      if (kind === 'track') {
        const track = await getSpotifyTrack(id);

        let dbDownload = insertTrackDownload({
          complete: false,
          name: track.name
        });

        const fileName = `spot-${track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`;
        const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        const fsPipe = fs.createWriteStream(filePath);

        const pipe = downloadSpotifyTrack(id);
        pipe.pipe(fsPipe);

        await new Promise((resolve) => {
          pipe.on('close', resolve);
        });

        dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath });

        return dbDownload;
      } else {
        const [album, tracks] = await Promise.all([getSpotifyAlbum(id), getSpotifyAlbumTracks(id)]);

        const releaseDownload = insertReleaseDownload({ name: album.name });

        return Promise.all(
          tracks.map(async (track) => {
            let dbDownload = insertTrackDownload({
              complete: false,
              name: track.name,
              releaseDownloadId: releaseDownload.id
            });

            const fileName = `spot-${track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`;
            const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            const fsPipe = fs.createWriteStream(filePath);

            const pipe = downloadSpotifyTrack(track.id);
            pipe.pipe(fsPipe);

            await new Promise((resolve) => {
              pipe.on('close', resolve);
            });

            dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath });

            return dbDownload;
          })
        );
      }
    } else {
      const { kind, id } = input;
      if (kind === 'track') {
        const scTrack = await getTrack(id);

        let dbDownload = insertTrackDownload({
          complete: false,
          name: scTrack.title
        });

        const fileName = `sc-${scTrack.id}-${Date.now()}-${randomInt(0, 10)}`;
        const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        const fsPipe = fs.createWriteStream(filePath);

        const dlPipe = await downloadTrack(scTrack);
        dlPipe.pipe(fsPipe);

        await new Promise((resolve) => {
          dlPipe.on('close', resolve);
        });

        const artwork = await ifNotNull(scTrack.artwork_url, (artworkUrl) =>
          getLargestAvailableImage(artworkUrl)
        );

        const { artists, title } = parseArtistTitle(scTrack.title);
        await writeTrackMetadata(filePath, {
          title,
          artists: artists ?? [scTrack.user.username],
          album: title,
          albumArtists: artists ?? [scTrack.user.username],
          trackNumber: '1'
        });
        if (artwork) {
          await writeTrackCoverArt(filePath, artwork);
        }

        dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath });

        return dbDownload;
      } else {
        const scPlaylist = await getPlaylist(id);

        const releaseDownload = insertReleaseDownload({ name: scPlaylist.title });

        const playlistArtistTitle = parseArtistTitle(scPlaylist.title);
        const releaseArtists = playlistArtistTitle.artists ?? [scPlaylist.user.username];
        const releaseTitle = playlistArtistTitle.title;

        return Promise.all(
          scPlaylist.tracks.map(async (track, i) => {
            const scTrack = 'title' in track ? track : await getTrack(track.id);

            let dbDownload = insertTrackDownload({
              complete: false,
              name: scTrack.title,
              releaseDownloadId: releaseDownload.id
            });

            const fileName = `sc-${scTrack.id}-${Date.now()}-${randomInt(0, 10)}`;
            const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            const fsPipe = fs.createWriteStream(filePath);

            const dlPipe = await downloadTrack(scTrack);
            dlPipe.pipe(fsPipe);

            await new Promise((resolve) => {
              dlPipe.on('close', resolve);
            });

            const artwork = await ifNotNull(scTrack.artwork_url, (artworkUrl) =>
              getLargestAvailableImage(artworkUrl)
            );

            const { artists, title } = parseArtistTitle(scTrack.title);
            await writeTrackMetadata(filePath, {
              title,
              artists: artists ?? [scTrack.user.username],
              album: releaseTitle,
              albumArtists: releaseArtists,
              trackNumber: (i + 1).toString()
            });
            if (artwork) {
              await writeTrackCoverArt(filePath, artwork);
            }

            dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath });

            return dbDownload;
          })
        );
      }
    }
  }),
  getAll: publicProcedure.query(async () => {
    const [tracks, releases] = await Promise.all([
      getAllTrackDownloads(),
      getAllReleaseDownloads()
    ]);
    return { tracks, releases };
  })
});
