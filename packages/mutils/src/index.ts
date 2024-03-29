import { uniq } from 'utils'

export type CoverArtOptions = {
  width?: number
  height?: number
  size?: number
}

export const makeImageUrl = (id: number, opts?: CoverArtOptions) => {
  const pathname = `/api/images/${id}`

  const searchParams = new URLSearchParams()

  if (opts?.size !== undefined) {
    searchParams.append('size', opts.size.toString())
  }
  if (opts?.width !== undefined) {
    searchParams.append('width', opts.width.toString())
  }
  if (opts?.height !== undefined) {
    searchParams.append('height', opts.height.toString())
  }

  let search = searchParams.toString()
  if (search.length > 0) {
    search = `?${search}`
  }

  return `${pathname}${search}`
}

export type CollageOptions =
  | {
      width: number
      height: number
    }
  | {
      size: number
    }

export const makeCollageUrl = (images_: number[], opts: CollageOptions) => {
  const images = uniq(images_)

  if (images.length === 0) return
  if (images.length === 1) return makeImageUrl(images[0], opts)

  const pathname = `/api/images/collage`

  const searchParams = new URLSearchParams()

  if ('size' in opts) {
    searchParams.append('size', opts.size.toString())
  } else {
    searchParams.append('width', opts.width.toString())
    searchParams.append('height', opts.height.toString())
  }

  for (const image of images.slice(0, 4)) {
    searchParams.append('images', image.toString())
  }

  let search = searchParams.toString()
  if (search.length > 0) {
    search = `?${search}`
  }

  return `${pathname}${search}`
}
