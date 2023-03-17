import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent();
  await trpc.releases.getAll.prefetchQuery();
};