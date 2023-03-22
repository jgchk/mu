import type { Database } from 'db';
import filenamify from 'filenamify';
import fs from 'fs/promises';
import type { Metadata } from 'music-metadata';
import { readTrackCoverArt, readTrackMetadata } from 'music-metadata';
import path from 'path';
import { z } from 'zod';

import { publicProcedure, router } from '../trpc';
import { walkDir } from '../utils/fs';

export const importRouter = router({
  file: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input: { filePath }, ctx }) => importFile(ctx.db, ctx.musicDir, filePath)),
  dir: publicProcedure
    .input(z.object({ dirPath: z.string() }))
    .mutation(async ({ input: { dirPath }, ctx }) => {
      const filePaths = [];
      for await (const filePath of walkDir(dirPath)) {
        filePaths.push(filePath);
      }
      return Promise.all(filePaths.map((filePath) => importFile(ctx.db, ctx.musicDir, filePath)));
    }),
  trackDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const download = ctx.db.trackDownloads.get(id);

      if (!download.complete) {
        throw new Error('Download is not complete');
      }
      if (!download.path) {
        throw new Error('Download has no path');
      }

      const track = await importFiles(ctx.db, ctx.musicDir, [download.path]);

      ctx.db.trackDownloads.delete(download.id);

      return track;
    }),
  releaseDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const download = ctx.db.releaseDownloads.get(id);
      const trackDownloads = ctx.db.trackDownloads.getByReleaseDownloadId(download.id);

      const allTrackDownloadsComplete = trackDownloads.every((download) => download.complete);
      if (!allTrackDownloadsComplete) {
        throw new Error('Not all downloads are complete');
      }

      const allTrackDownloadsHavePaths = trackDownloads.every((download) => download.path);
      if (!allTrackDownloadsHavePaths) {
        throw new Error('Not all downloads have paths');
      }

      const tracks = await importFiles(
        ctx.db,
        ctx.musicDir,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trackDownloads.map((download) => download.path!)
      );

      trackDownloads.forEach((download) => ctx.db.trackDownloads.delete(download.id));
      ctx.db.releaseDownloads.delete(download.id);

      return tracks;
    }),
  scPlaylistDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const download = ctx.db.soundcloudPlaylistDownloads.get(id);
      const trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(download.id);

      const allTrackDownloadsComplete = trackDownloads.every(
        (download) => download.progress === 100
      );
      if (!allTrackDownloadsComplete) {
        throw new Error('Not all downloads are complete');
      }

      const allTrackDownloadsHavePaths = trackDownloads.every((download) => download.path);
      if (!allTrackDownloadsHavePaths) {
        throw new Error('Not all downloads have paths');
      }

      const tracks = await importFiles(
        ctx.db,
        ctx.musicDir,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trackDownloads.map((download) => download.path!)
      );

      trackDownloads.forEach((download) => ctx.db.soundcloudTrackDownloads.delete(download.id));
      ctx.db.soundcloudPlaylistDownloads.delete(download.id);

      return tracks;
    }),
  scTrackDownload: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const download = ctx.db.soundcloudTrackDownloads.get(id);

      if (download.progress !== 100) {
        throw new Error('Download is not complete');
      }
      if (!download.path) {
        throw new Error('Download has no path');
      }

      const track = await importFiles(ctx.db, ctx.musicDir, [download.path]);

      ctx.db.soundcloudTrackDownloads.delete(download.id);

      return track;
    })
});

const importFiles = async (db: Database, musicDir: string, filePaths: string[]) => {
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
    const matchingArtists = db.artists.getByName(name);
    if (matchingArtists.length > 0) {
      return matchingArtists[0];
    } else {
      return db.artists.insert({ name });
    }
  });

  const dbRelease = db.releases.insertWithArtists({
    title: trackData[0].metadata.album ?? trackData[0].metadata.title,
    artists: albumArtists.map((artist) => artist.id)
  });

  const dbTracks = await Promise.all(
    trackData.map(({ metadata, filePath }) =>
      importFile(db, musicDir, filePath, metadata, dbRelease.id)
    )
  );

  return {
    release: dbRelease,
    tracks: dbTracks
  };
};

const importFile = async (
  db: Database,
  musicDir: string,
  filePath: string,
  metadata_?: Metadata,
  releaseId?: number
) => {
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
    const matchingArtists = db.artists.getByName(name);
    if (matchingArtists.length > 0) {
      return matchingArtists[0];
    } else {
      return db.artists.insert({ name });
    }
  });

  let filename = '';
  if (metadata.trackNumber !== null) {
    filename += `${metadata.trackNumber} `;
  }
  filename += metadata.title;
  filename += path.extname(filePath);

  const newPath = path.join(
    musicDir,
    filenamify(metadata.albumArtists.join(', ')),
    filenamify(metadata.album || '[untitled]'),
    filenamify(filename)
  );

  const track = db.tracks.insertWithArtists({
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
