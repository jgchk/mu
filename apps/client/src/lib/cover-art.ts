export type CoverArtOptions = {
  width?: number
  height?: number
  size?: number
}

export const makeImageUrl = (id: number, opts?: CoverArtOptions) => {
  const pathname = `/api/images/${id}`

  const searchParams = new URLSearchParams()

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

  let search = searchParams.toString()
  if (search.length > 0) {
    search = `?${search}`
  }

  return `${pathname}${search}`
}
