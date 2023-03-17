import { getAllArtists } from 'db';

import { publicProcedure, router } from '../trpc';

export const artistsRouter = router({
  getAll: publicProcedure.query(() => getAllArtists())
});
