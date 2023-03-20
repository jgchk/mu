import { getAllReleaseDownloads, getAllTrackDownloads } from 'db';
import { queueDownload } from 'downloader';
import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

const SoundcloudDownload = z.object({
  service: z.literal('soundcloud'),
  kind: z.enum(['track', 'playlist']),
  id: z.number()
});

const SpotifyDownload = z.object({
  service: z.literal('spotify'),
  kind: z.enum(['track', 'album']),
  id: z.string()
});

const DownloadRequest = z.union([SoundcloudDownload, SpotifyDownload]);

export const downloadsRouter = router({
  download: publicProcedure.input(DownloadRequest).mutation(({ input }) => {
    queueDownload(input);
  }),
  getAll: publicProcedure.query(async () => {
    const [tracks, releases] = await Promise.all([
      getAllTrackDownloads(),
      getAllReleaseDownloads()
    ]);
    return { tracks, releases };
  })
});
