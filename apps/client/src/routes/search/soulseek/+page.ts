import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const queryParam = url.searchParams.get('q');

  const query = queryParam ?? '';
  const hasQuery = query.length > 0;

  return { query, hasQuery };
};
