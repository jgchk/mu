import { randomInt } from 'crypto';
import {
  getAllReleaseDownloads,
  getAllTrackDownloads,
  insertReleaseDownload,
  insertTrackDownload,
  updateTrackDownload
} from 'db';
import fs from 'fs';
import got from 'got';
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata';
import path from 'path';
import { downloadSpotifyTrack, getSpotifyTrack, parseUri } from 'spotify';
import { z } from 'zod';

import { env } from '../env';
import {
  downloadTrack,
  getPlaylist,
  getSoundcloudImageUrl,
  getTrack
} from '../services/soundcloud';
import { publicProcedure, router } from '../trpc';
import { ifNotNull } from '../utils/types';

const SoundcloudDownload = z.object({
  service: z.literal('soundcloud'),
  id: z.number(),
  kind: z.enum(['track', 'playlist'])
});

const SpotifyDownload = z.object({
  service: z.literal('spotify'),
  url: z.string()
});

const DownloadRequest = z.union([SoundcloudDownload, SpotifyDownload]);

export const downloadsRouter = router({
  download: publicProcedure.input(DownloadRequest).mutation(async ({ input }) => {
    if (input.service === 'spotify') {
      const { url } = input;
      const spotifyId = parseUri(url);

      if (spotifyId.kind !== 'track') {
        throw new Error('Only Spotify tracks are supported');
      }

      const track = await getSpotifyTrack(spotifyId.id);

      let dbDownload = insertTrackDownload({
        complete: false,
        name: track.name
      });

      const fileName = `spot-${track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`;
      const filePath = path.resolve(path.join(env.DOWNLOAD_DIR, fileName));
      const fsPipe = fs.createWriteStream(filePath);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

      const pipe = downloadSpotifyTrack(spotifyId.id);
      pipe.pipe(fsPipe);

      await new Promise((resolve) => {
        pipe.on('close', resolve);
      });

      dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath });

      return dbDownload;
    } else {
      const { kind, id } = input;
      if (kind === 'track') {
        const scTrack = await getTrack(id);

        let dbDownload = insertTrackDownload({
          complete: false,
          name: scTrack.title
        });

        const filePath = await downloadTrack(scTrack);

        const artwork = await ifNotNull(scTrack.artwork_url, async (artworkUrl) => {
          const originalArtworkUrl = getSoundcloudImageUrl(artworkUrl, 'original');
          const artwork_ = await got(originalArtworkUrl).buffer();
          return {
            data: artwork_,
            url: originalArtworkUrl
          };
        });

        const { artists, title } = parseArtistTitle(scTrack.title);
        await writeTrackMetadata(filePath, {
          title,
          artists: artists ?? [scTrack.user.username],
          album: title,
          albumArtists: artists ?? [scTrack.user.username],
          trackNumber: '1'
        });
        if (artwork) {
          await writeTrackCoverArt(filePath, artwork.data);
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

            const filePath = await downloadTrack(scTrack);

            const artwork = await ifNotNull(scTrack.artwork_url, async (artworkUrl) => {
              const originalArtworkUrl = getSoundcloudImageUrl(artworkUrl, 'original');
              const artwork_ = await got(originalArtworkUrl).buffer();
              return {
                data: artwork_,
                url: originalArtworkUrl
              };
            });

            const { artists, title } = parseArtistTitle(scTrack.title);
            await writeTrackMetadata(filePath, {
              title,
              artists: artists ?? [scTrack.user.username],
              album: releaseTitle,
              albumArtists: releaseArtists,
              trackNumber: (i + 1).toString()
            });
            if (artwork) {
              await writeTrackCoverArt(filePath, artwork.data);
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
