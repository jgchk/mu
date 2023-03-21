import type { Database } from 'db';
import type { DownloadQueue } from 'downloader';

export type Context = {
  db: Database;
  dl: DownloadQueue;
};
