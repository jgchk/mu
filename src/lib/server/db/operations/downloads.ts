import { eq } from 'drizzle-orm/expressions'

import { db } from '../instance'
import { type Download, downloads, type InsertDownload } from '../schema'

export type DownloadPretty = Omit<Download, 'complete'> & { complete: boolean }
export type InsertDownloadPretty = Omit<InsertDownload, 'complete'> & { complete: boolean }

export const convertInsertDownload = (download: InsertDownloadPretty): InsertDownload => ({
  ...download,
  complete: download.complete ? 1 : 0,
})

export const convertDownload = (download: Download): DownloadPretty => ({
  ...download,
  complete: !!download.complete,
})

export const insertDownload = (download: InsertDownloadPretty) =>
  convertDownload(db.insert(downloads).values(convertInsertDownload(download)).returning().get())

export const updateDownload = (
  id: Download['id'],
  data: Partial<Omit<InsertDownloadPretty, 'id'>>
) => {
  const update = {
    ...(data.ref !== undefined ? { ref: data.ref } : {}),
    ...(data.complete !== undefined ? { complete: data.complete ? 1 : 0 } : {}),
    ...(data.path !== undefined ? { path: data.path } : {}),
  }
  return convertDownload(
    db.update(downloads).set(update).where(eq(downloads.id, id)).returning().get()
  )
}

export const getAllDownloads = () => db.select().from(downloads).all().map(convertDownload)

export const getDownloadById = (id: Download['id']) =>
  db.select().from(downloads).where(eq(downloads.id, id)).get()

export const deleteDownloadById = (id: Download['id']) =>
  db.delete(downloads).where(eq(downloads.id, id)).run()
