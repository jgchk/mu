import { eq } from 'drizzle-orm/expressions';

import { db } from '..';
import { type InsertReleaseDownload, type ReleaseDownload, releaseDownloads } from '../schema';

export const insertReleaseDownload = (releaseDownload: InsertReleaseDownload) =>
  db.insert(releaseDownloads).values(releaseDownload).returning().get();

export const getAllReleaseDownloads = () => db.select().from(releaseDownloads).all();

export const getReleaseDownloadById = (id: ReleaseDownload['id']) =>
  db.select().from(releaseDownloads).where(eq(releaseDownloads.id, id)).get();

export const deleteReleaseDownloadById = (id: ReleaseDownload['id']) =>
  db.delete(releaseDownloads).where(eq(releaseDownloads.id, id)).run();
