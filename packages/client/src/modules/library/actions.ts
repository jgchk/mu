import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { gql } from 'apollo-boost'
import apollo from '../../apollo'
import { LibraryRoute } from '../../pages/Library'
import { getErrorMessage } from '../../utils/error'
import { withPayloadType } from '../../utils/redux'
import { ViewType } from './reducers'

interface Library {
  artists: Artist[]
  releases: Release[]
  tracks: Track[]
}

interface Identifiable {
  id: string
}

interface Artist extends Identifiable {
  name: string
  releases: Identifiable[]
  tracks: Identifiable[]
}

interface Release extends Identifiable {
  title: string
  tracks: Identifiable[]
  artists: Identifiable[]
  remoteCovers: RemoteCover[]
  localCovers: LocalCover[]
}

interface RemoteCover {
  url: string
}

interface LocalCover {
  path: string
}

interface Track extends Identifiable {
  release: Identifiable
  artists: Identifiable[]
  num: number
  title: string
  remoteSources: RemoteSource[]
  localSources: LocalSource[]
}

interface RemoteSource {
  platform: string
  url: string
  protocol: string
}

interface LocalSource {
  path: string
}

export const requestLibrary = createAction('mu/library/REQUEST_LIBRARY')
export const receiveLibrary = createAction(
  'mu/library/RECEIVE_LIBRARY',
  withPayloadType<Library>()
)
export const failureLibrary = createAction(
  'mu/library/FAILURE_LIBRARY',
  withPayloadType<string>()
)
export const invalidateLibrary = createAction('mu/library/INVALIDATE_LIBRARY')
export const fetchLibrary = createAsyncThunk(
  'mu/library/FETCH_LIBRARY',
  async (arg, { dispatch }) => {
    dispatch(requestLibrary())

    try {
      const result = await apollo.query<Library>({
        query: gql`
          {
            artists {
              id
              name
              releases {
                id
              }
              tracks {
                id
              }
            }
            releases {
              id
              title
              tracks {
                id
              }
              artists {
                id
              }
              remoteCovers {
                url
              }
              localCovers {
                path
              }
            }
            tracks {
              id
              release {
                id
              }
              artists {
                id
              }
              num
              title
              remoteSources {
                platform
                url
                protocol
              }
              localSources {
                path
              }
            }
          }
        `,
      })
      dispatch(receiveLibrary(result.data))
    } catch (error) {
      dispatch(failureLibrary(getErrorMessage(error)))
    }
  }
)

export const setViewType = createAction(
  'mu/library/SET_VIEW_TYPE',
  withPayloadType<{ route: LibraryRoute; viewType: ViewType }>()
)
