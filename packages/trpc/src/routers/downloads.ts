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

const SoulseekDownload = z.object({
  service: z.literal('soulseek'),
  kind: z.enum(['track']),
  file: z.string()
});

const DownloadRequest = z.union([SoundcloudDownload, SpotifyDownload, SoulseekDownload]);

export const downloadsRouter = router({
  download: publicProcedure.input(DownloadRequest).mutation(({ input, ctx }) => {
    void ctx.dl.queue(input);
  }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const [tracks, releases] = await Promise.all([
      ctx.db.trackDownloads.getAll(),
      ctx.db.releaseDownloads.getAll()
    ]);
    return { tracks, releases };
  })
});
