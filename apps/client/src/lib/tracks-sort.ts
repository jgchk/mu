import { ifNotNull } from 'utils'

import type { RouterInput } from './trpc'

export type TracksSort = NonNullable<RouterInput['tracks']['getAllWithArtistsAndRelease']['sort']>

export const TRACKS_SORT_COLUMN_PARAM = 'sort'
export const TRACKS_SORT_DIRECTION_PARAM = 'dir'

export const getTracksSort = (url: URL): TracksSort | undefined => {
  const sortColumn = url.searchParams.get(TRACKS_SORT_COLUMN_PARAM)
  const sortDirection = url.searchParams.get(TRACKS_SORT_DIRECTION_PARAM)
  const sort =
    ifNotNull(sortColumn, (column) =>
      ifNotNull(sortDirection, (direction) => ({ column, direction } as TracksSort))
    ) ?? undefined
  return sort
}
