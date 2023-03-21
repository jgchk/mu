import type { Database } from 'db';
import type { DownloadQueue } from 'downloader';
import type { Soundcloud } from 'soundcloud';

export type Context = {
  db: Database;
  dl: DownloadQueue;
  sc: Soundcloud;
};
