import { env } from 'env'
import { fileTypeStream } from 'file-type'
import fs from 'fs'
import type { ImageManager } from 'image-manager'
import { isAnimatedGifStream } from 'is-animated-gif'
import mime from 'mime-types'
import { readTrackCoverArt } from 'music-metadata'
import path from 'path'
import type { OverlayOptions } from 'sharp'
import sharp from 'sharp'
import type { Readable } from 'stream'
import { PassThrough } from 'stream'
import { capitalize, ifDefined, tryOr } from 'utils'
import { fileExists, streamToBuffer } from 'utils/node'
import { z } from 'zod'

const handleResizeStream = async (
  stream: Readable,
  opts_: ResizeOptions = {}
): Promise<{ output: Readable; contentType?: string }> => {
  const width = opts_.width ?? opts_.size
  const height = opts_.height ?? opts_.size

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
  size: z.coerce.number().optional(),
})

export type Complete<T extends { path: string | null }> = Omit<T, 'path'> & {
  path: NonNullable<T['path']>
}
export const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
}

const getResizedImageBuffers = async (images: number[], opts?: ResizeOptions) => {
  const resizedStreams = await Promise.all(images.map((image) => handleResizeImage(image, opts)))
  const resizedBuffers = await Promise.all(resizedStreams.map((res) => streamToBuffer(res.output)))
  return resizedBuffers
}

export type CollageOptions = z.infer<typeof CollageOptions>
export const CollageOptions = z
  .object({ width: z.coerce.number(), height: z.coerce.number() })
  .or(z.object({ size: z.coerce.number() }))
  .and(z.object({ images: z.union([z.coerce.number().array(), z.coerce.number()]) }))

export const handleCreateCollage = async (
  opts_: CollageOptions
): Promise<{ output: Readable; contentType?: string }> => {
  const images = (Array.isArray(opts_.images) ? opts_.images : [opts_.images]).slice(0, 4)
  const sizeOpts = 'size' in opts_ ? { width: opts_.size, height: opts_.size } : opts_

  let composite: OverlayOptions[]
  if (images.length === 0) {
    throw new Error('No images provided')
  } else if (images.length === 1) {
    return handleResizeImage(images[0], sizeOpts)
  } else {
    const resizedImages = await getResizedImageBuffers(images, {
      width: sizeOpts.width / 2,
      height: sizeOpts.height / 2,
    })

    if (images.length === 2) {
      composite = [
        { input: resizedImages[0], gravity: 'northwest' },
        { input: resizedImages[0], gravity: 'northeast' },
        { input: resizedImages[1], gravity: 'southwest' },
        { input: resizedImages[1], gravity: 'southeast' },
      ]
    } else if (images.length === 3) {
      composite = [
        { input: resizedImages[0], gravity: 'northwest' },
        { input: resizedImages[1], gravity: 'northeast' },
        { input: resizedImages[2], gravity: 'southwest' },
        { input: resizedImages[2], gravity: 'southeast' },
      ]
    } else {
      composite = [
        { input: resizedImages[0], gravity: 'northwest' },
        { input: resizedImages[1], gravity: 'northeast' },
        { input: resizedImages[2], gravity: 'southwest' },
        { input: resizedImages[3], gravity: 'southeast' },
      ]
    }
  }

  const collage = sharp({
    create: {
      width: sizeOpts.width,
      height: sizeOpts.height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composite)
    .png()

  return { output: collage, contentType: 'image/png' }
}

export const getCoverArtImage = async (imageManager: ImageManager, filePath: string) => {
  // check for embedded art
  const embeddedArt = await readTrackCoverArt(filePath)
  if (embeddedArt) {
    return imageManager.getImage(embeddedArt)
  }

  // check for art in the same directory
  const coverArtFile = await getCoverArtFile(filePath)
  return ifDefined(coverArtFile, (imageFilePath) => imageManager.getImageFromFile(imageFilePath))
}

export const getCoverArtFile = async (filePath: string) => {
  // check for art in the same directory
  const dirPath = path.dirname(filePath)

  const fileNames = ['cover', 'folder', 'album', 'front']
  const fileExtensions = ['jpg', 'jpeg', 'png', 'gif']

  const filePaths = fileNames.flatMap((fileName) => {
    const capitalizedFileName = capitalize(fileName)
    return [
      ...fileExtensions.map((fileExtension) => path.join(dirPath, `${fileName}.${fileExtension}`)),
      ...fileExtensions.map((fileExtension) =>
        path.join(dirPath, `${capitalizedFileName}.${fileExtension}`)
      ),
    ]
  })

  const imageFilePath = await tryOr(
    () =>
      Promise.any(
        filePaths.map(async (filePath) => {
          const exists = await fileExists(filePath)
          if (!exists) {
            throw new Error('No album art found')
          }

          return filePath
        })
      ),
    undefined
  )

  return imageFilePath
}
