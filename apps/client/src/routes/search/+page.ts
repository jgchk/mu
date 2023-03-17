import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q');

  const query = queryParam ?? '';
  const hasQuery = query.length > 0;

  if (hasQuery) {
    const { trpc } = await parent();
    await trpc.search.soundcloud.prefetchQuery({ query });
    await trpc.search.soulseek.prefetchQuery({ query });
  }

  return { query, hasQuery };
};
