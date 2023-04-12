export type CoverArtOptions = {
  width?: number
  height?: number
  size?: number
}

export const makeTrackCoverArtUrl = (id: number, hash: string, opts?: CoverArtOptions) => {
  const pathname = `/api/tracks/${id}/cover-art`

  const searchParams = new URLSearchParams()
  searchParams.append('hash', hash)

  if (opts?.size !== undefined) {
    searchParams.append('width', opts.size.toString())
    searchParams.append('height', opts.size.toString())
  } else {
    if (opts?.width !== undefined) {
      searchParams.append('width', opts.width.toString())
    }
    if (opts?.height !== undefined) {
      searchParams.append('height', opts.height.toString())
    }
  }

  return `${pathname}?${searchParams.toString()}`
}

export const makeReleaseCoverArtUrl = (id: number, hash: string, opts?: CoverArtOptions) => {
  const pathname = `/api/releases/${id}/cover-art`

  const searchParams = new URLSearchParams()
  searchParams.append('hash', hash)

  if (opts?.size !== undefined) {
    searchParams.append('width', opts.size.toString())
    searchParams.append('height', opts.size.toString())
  } else {
    if (opts?.width !== undefined) {
      searchParams.append('width', opts.width.toString())
    }
    if (opts?.height !== undefined) {
      searchParams.append('height', opts.height.toString())
    }
  }

  return `${pathname}?${searchParams.toString()}`
}
