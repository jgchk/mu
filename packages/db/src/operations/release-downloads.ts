import { eq } from 'drizzle-orm/expressions';

import { db } from '..';
import type { InsertReleaseDownload, ReleaseDownload } from '../schema';
import { releaseDownloads } from '../schema';

export const insertReleaseDownload = (releaseDownload: InsertReleaseDownload) =>
  db.insert(releaseDownloads).values(releaseDownload).returning().get();

export const updateReleaseDownload = (
  id: ReleaseDownload['id'],
  data: Partial<Omit<InsertReleaseDownload, 'id'>>
) => {
  const update = {
    ...(data.name !== undefined ? { name: data.name } : {})
  };
  return db
    .update(releaseDownloads)
    .set(update)
    .where(eq(releaseDownloads.id, id))
    .returning()
    .get();
};

export const getAllReleaseDownloads = () => db.select().from(releaseDownloads).all();

export const getReleaseDownloadById = (id: ReleaseDownload['id']) =>
  db.select().from(releaseDownloads).where(eq(releaseDownloads.id, id)).get();

export const deleteReleaseDownloadById = (id: ReleaseDownload['id']) =>
  db.delete(releaseDownloads).where(eq(releaseDownloads.id, id)).run();
