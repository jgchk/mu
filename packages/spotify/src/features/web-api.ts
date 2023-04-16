import got from 'got'
import { z } from 'zod'

import type { SearchResults, SearchType } from '../model'
import {
  AuthResponse,
  FullAlbum,
  FullTrack,
  Pager,
  SimplifiedAlbum,
  SimplifiedTrack,
} from '../model'
import type { SpotifyBase } from './base'
import type { Constructor } from './types'

export type WebApiFeature = WebApiEnabled | WebApiDisabled
export type WebApiEnabled = {
  webApi: true
  clientId: string
  clientSecret: string

  getAccessToken(): Promise<string>
  getTrack(trackId: string): Promise<FullTrack>
  getAlbum(albumId: string): Promise<FullAlbum>
  getAlbumTracks(albumId: string): Promise<SimplifiedTrack[]>
  search<T extends SearchType[]>(query: string, types: T): Promise<SearchResults<T>>
}
export type WebApiDisabled = {
  webApi: false
}

export type WebApiParams = {
  clientId: string
  clientSecret: string
}

const WebApiEnabledMixin =
  (params: WebApiParams) =>
  <TBase extends Constructor<SpotifyBase>>(Base: TBase): Constructor<WebApiEnabled> & TBase =>
    class extends Base implements WebApiEnabled {
      webApi = true as const
      clientId = params.clientId
      clientSecret = params.clientSecret

      async getAccessToken() {
        const res = await got
          .post('https://accounts.spotify.com/api/token', {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
                'base64'
              )}`,
            },
            form: { grant_type: 'client_credentials' },
          })
          .json()
          .then((res) => AuthResponse.parse(res))
        return res.access_token
      }

      async getTrack(trackId: string) {
        const token = await this.getAccessToken()
        const res = await got
          .get(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json()
          .then((res) => FullTrack.parse(res))
        return res
      }

      async getAlbum(albumId: string) {
        const token = await this.getAccessToken()
        const res = await got
          .get(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json()
          .then((res) => FullAlbum.parse(res))
        return res
      }

      async getAlbumTracks(albumId: string) {
        const token = await this.getAccessToken()

        const results: SimplifiedTrack[] = []

        let next: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks`
        while (next) {
          const res: Pager<SimplifiedTrack> = await got
            .get(next, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .json()
            .then((res) => Pager(SimplifiedTrack).parse(res))
          results.push(...res.items)
          next = res.next
        }

        return results
      }

      async search<T extends SearchType[]>(query: string, types: T): Promise<SearchResults<T>> {
        const token = await this.getAccessToken()
        const res = await got
          .get('https://api.spotify.com/v1/search', {
            searchParams: {
              q: query,
              type: types.join(','),
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json()

        const parser = z.object({
          tracks: types.includes('track') ? Pager(FullTrack) : z.undefined(),
          albums: types.includes('album') ? Pager(SimplifiedAlbum) : z.undefined(),
        })

        const parsed = parser.parse(res)
        return parsed as SearchResults<T>
      }
    }

const WebApiDisabledMixin = <TBase extends Constructor<SpotifyBase>>(
  Base: TBase
): Constructor<WebApiDisabled> & TBase =>
  class extends Base implements WebApiDisabled {
    webApi = false as const
  }

export const WebApiMixin =
  (params?: WebApiParams) =>
  <TBase extends Constructor<SpotifyBase>>(Base: TBase) =>
    params ? WebApiEnabledMixin(params)(Base) : WebApiDisabledMixin(Base)
