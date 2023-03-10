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

export const updateDownloadStatus = (id: number, complete: boolean) =>
  db
    .update(downloads)
    .set({ complete: complete ? 1 : 0 })
    .where(eq(downloads.id, id))
    .returning()
    .get()

export const getAllDownloads = () => db.select().from(downloads).all().map(convertDownload)
