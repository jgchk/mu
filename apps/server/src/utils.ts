import { fileTypeStream } from 'file-type'
import fs from 'fs'
import { isAnimatedGifStream } from 'is-animated-gif'
import mime from 'mime-types'
import path from 'path'
import sharp from 'sharp'
import type { Readable } from 'stream'
import { PassThrough } from 'stream'
import { z } from 'zod'

import { env } from './env'

const handleResizeStream = async (
  stream: Readable,
  { width, height }: ResizeOptions = {}
): Promise<{ output: Readable; contentType?: string }> => {
  if (width !== undefined || height !== undefined) {
    const ftStream = await fileTypeStream(stream)
    if (ftStream.fileType?.mime === 'image/gif') {
      const animated = await isAnimatedGifStream(ftStream)
      if (animated) {
        // resizing animated gifs is super slow. just return the original
        return { output: ftStream, contentType: 'image/gif' }
      } else {
        const resizerStream = sharp().resize(width, height).gif()
        const resizedStream = ftStream.pipe(resizerStream).pipe(new PassThrough())
        return { output: resizedStream, contentType: 'image/gif' }
      }
    } else {
      const resizerStream = sharp().resize(width, height).png()
      const resizedStream = ftStream.pipe(resizerStream).pipe(new PassThrough())
      return { output: resizedStream, contentType: 'image/png' }
    }
  } else {
    let contentType: string | undefined
    const ftStream = await fileTypeStream(stream)
    if (ftStream.fileType) {
      contentType = mime.contentType(ftStream.fileType.mime) || undefined
    }
    return { output: ftStream, contentType }
  }
}

export const handleResizeImage = async (
  imageId: number,
  opts?: ResizeOptions
): Promise<{ output: Readable; contentType?: string }> => {
  const imagePath = path.resolve(path.join(env.IMAGES_DIR, imageId.toString()))
  const readStream = fs.createReadStream(imagePath)
  return handleResizeStream(readStream, opts)
}

export type ResizeOptions = z.infer<typeof ResizeOptions>
export const ResizeOptions = z.object({
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
})

export type Complete<T extends { path: string | null }> = Omit<T, 'path'> & {
  path: NonNullable<T['path']>
}
export const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
}
