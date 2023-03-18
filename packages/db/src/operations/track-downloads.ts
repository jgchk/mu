import { eq } from 'drizzle-orm/expressions';

import { db } from '..';
import type { InsertTrackDownload, TrackDownload } from '../schema';
import { trackDownloads } from '../schema';

export type TrackDownloadPretty = Omit<TrackDownload, 'complete'> & { complete: boolean };
export type InsertTrackDownloadPretty = Omit<InsertTrackDownload, 'complete'> & {
  complete: boolean;
};

export const convertInsertTrackDownload = (
  trackDownload: InsertTrackDownloadPretty
): InsertTrackDownload => ({
  ...trackDownload,
  complete: trackDownload.complete ? 1 : 0
});

export const convertTrackDownload = (trackDownload: TrackDownload): TrackDownloadPretty => ({
  ...trackDownload,
  complete: !!trackDownload.complete
});

export const insertTrackDownload = (trackDownload: InsertTrackDownloadPretty) =>
  convertTrackDownload(
    db.insert(trackDownloads).values(convertInsertTrackDownload(trackDownload)).returning().get()
  );

export const updateTrackDownload = (
  id: TrackDownload['id'],
  data: Partial<Omit<InsertTrackDownloadPretty, 'id'>>
) => {
  const update = {
    ...(data.complete !== undefined ? { complete: data.complete ? 1 : 0 } : {}),
    ...(data.path !== undefined ? { path: data.path } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.releaseDownloadId !== undefined ? { releaseDownloadId: data.releaseDownloadId } : {})
  };
  return convertTrackDownload(
    db.update(trackDownloads).set(update).where(eq(trackDownloads.id, id)).returning().get()
  );
};

export const getAllTrackDownloads = () =>
  db.select().from(trackDownloads).all().map(convertTrackDownload);

export const getTrackDownloadById = (id: TrackDownload['id']) =>
  db.select().from(trackDownloads).where(eq(trackDownloads.id, id)).get();

export const getTrackDownloadsByReleaseDownloadId = (
  releaseDownloadId: NonNullable<TrackDownload['releaseDownloadId']>
) =>
  db
    .select()
    .from(trackDownloads)
    .where(eq(trackDownloads.releaseDownloadId, releaseDownloadId))
    .all()
    .map(convertTrackDownload);

export const deleteTrackDownloadById = (id: TrackDownload['id']) =>
  db.delete(trackDownloads).where(eq(trackDownloads.id, id)).run();
