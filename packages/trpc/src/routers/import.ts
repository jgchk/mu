import {
  deleteReleaseDownloadById,
  deleteTrackDownloadById,
  getArtistsByName,
  getReleaseDownloadById,
  getTrackDownloadById,
  getTrackDownloadsByReleaseDownloadId,
  insertArtist,
  insertReleaseWithArtists,
  insertTrackWithArtists
} from 'db';
import filenamify from 'filenamify';
import fs from 'fs/promises';
import type { Metadata } from 'music-metadata';
import { readTrackCoverArt, readTrackMetadata } from 'music-metadata';
import path from 'path';
import untildify from 'untildify';
import { z } from 'zod';

import { env } from '../env';
import { publicProcedure, router } from '../trpc';
import { walkDir } from '../utils/fs';

export const importRouter = router({
  file: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input: { filePath } }) => importFile(filePath)),
  dir: publicProcedure
    .input(z.object({ dirPath: z.string() }))
    .mutation(async ({ input: { dirPath } }) => {
      const filePaths = [];
      for await (const filePath of walkDir(dirPath)) {
        filePaths.push(filePath);
      }
      return Promise.all(filePaths.map((filePath) => importFile(filePath)));
    }),
  trackDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id } }) => {
      const download = getTrackDownloadById(id);

      if (!download.complete) {
        throw new Error('Download is not complete');
      }
      if (!download.path) {
        throw new Error('Download has no path');
      }

      const track = await importFiles([download.path]);

      deleteTrackDownloadById(download.id);

      return track;
    }),
  releaseDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id } }) => {
      const download = getReleaseDownloadById(id);

      const trackDownloads = getTrackDownloadsByReleaseDownloadId(download.id);

      const allTrackDownloadsComplete = trackDownloads.every((download) => download.complete);
      if (!allTrackDownloadsComplete) {
        throw new Error('Not all downloads are complete');
      }

      const allTrackDownloadsHavePaths = trackDownloads.every((download) => download.path);
      if (!allTrackDownloadsHavePaths) {
        throw new Error('Not all downloads have paths');
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tracks = await importFiles(trackDownloads.map((download) => download.path!));

      trackDownloads.forEach((download) => deleteTrackDownloadById(download.id));
      deleteReleaseDownloadById(download.id);

      return tracks;
    })
});

const importFiles = async (filePaths: string[]) => {
  const trackData = await Promise.all(
    filePaths.map(async (filePath) => {
      const metadata = await readTrackMetadata(filePath);

      if (!metadata) {
        throw new Error('No metadata available');
      }

      return {
        filePath,
        metadata
      };
    })
  );

  const albumArtists = trackData[0].metadata.albumArtists.map((name) => {
    const matchingArtists = getArtistsByName(name);
    if (matchingArtists.length > 0) {
      return matchingArtists[0];
    } else {
      return insertArtist({ name });
    }
  });

  const dbRelease = insertReleaseWithArtists({
    title: trackData[0].metadata.album,
    artists: albumArtists.map((artist) => artist.id)
  });

  const dbTracks = await Promise.all(
    trackData.map(({ metadata, filePath }) => importFile(filePath, metadata, dbRelease.id))
  );

  return {
    release: dbRelease,
    tracks: dbTracks
  };
};

const importFile = async (filePath: string, metadata_?: Metadata, releaseId?: number) => {
  const metadata = metadata_ ?? (await readTrackMetadata(filePath));
  const coverArt = await readTrackCoverArt(filePath);

  // returns undefined if no metadata available
  if (!metadata) {
    throw new Error('No metadata available');
  }

  // convert artist names to artist ids
  // - if artist with name exists, use that
  // - if not, create new artist
  const artists = metadata.artists.map((name) => {
    const matchingArtists = getArtistsByName(name);
    if (matchingArtists.length > 0) {
      return matchingArtists[0];
    } else {
      return insertArtist({ name });
    }
  });

  let filename = '';
  if (metadata.trackNumber !== undefined) {
    filename += `${metadata.trackNumber} `;
  }
  filename += metadata.title;
  filename += path.extname(filePath);

  const musicDir = untildify(env.MUSIC_DIR);
  const newPath = path.join(
    musicDir,
    filenamify(metadata.albumArtists.join(', ')),
    filenamify(metadata.album || '[untitled]'),
    filenamify(filename)
  );

  const track = insertTrackWithArtists({
    title: metadata.title,
    artists: artists.map((artist) => artist.id),
    path: newPath,
    releaseId,
    trackNumber: metadata.trackNumber,
    hasCoverArt: coverArt !== undefined
  });

  if (filePath !== newPath) {
    await fs.mkdir(path.dirname(newPath), { recursive: true });
    await fs.rename(filePath, newPath);
  }

  return track;
};
