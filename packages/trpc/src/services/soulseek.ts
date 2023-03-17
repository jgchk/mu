import { MemoryCache } from 'memory-cache-node';
import type { Messages } from 'soulseek-ts';
import { SlskClient } from 'soulseek-ts';

const SLSK_SEARCH_TTL = 60; // seconds
const SLSK_CACHE_CLEAN_INTERVAL = 60; // seconds
const SLSK_MAX_CACHED_SEARCHES = 10;

type SearchData = {
  startTime: Date;
  results: Messages.From.Peer.FileSearchResponse[];
  complete: boolean;
};

let slsk: SlskClient | undefined;
const cache = new MemoryCache<string, SearchData>(
  SLSK_CACHE_CLEAN_INTERVAL,
  SLSK_MAX_CACHED_SEARCHES
);

export async function getSlskClient() {
  if (!slsk) {
    slsk = new SlskClient();
    await slsk.login('gimminy_crick__', 'fejwqi@#$234Fjewi');
  }

  return slsk;
}

export const searchSubscription = async (
  query: string,
  callback: (result: Messages.From.Peer.FileSearchResponse) => void
) => {
  const slsk = await getSlskClient();
  await slsk.search(query, { onResult: callback });
};

export const initiateSearch = (query: string) => {
  const data: SearchData = {
    startTime: new Date(),
    results: [],
    complete: false
  };

  const doSearch = async () => {
    cache.storeExpiringItem(query, data, SLSK_SEARCH_TTL);

    await searchSubscription(query, (result) => {
      data.results.push(result);
      cache.storeExpiringItem(query, data, SLSK_SEARCH_TTL);
    });

    data.complete = true;
    cache.storeExpiringItem(query, data, SLSK_SEARCH_TTL);
  };

  void doSearch();

  return data;
};

export const getSearchData = (query: string) => {
  const results = cache.retrieveItemValue(query);
  return results;
};

export const search = (query: string) => {
  const existingSearch = getSearchData(query);
  if (existingSearch !== undefined) {
    return existingSearch;
  }

  const newSearch = initiateSearch(query);
  return newSearch;
};
