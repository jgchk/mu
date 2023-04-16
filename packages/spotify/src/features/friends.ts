import got from 'got'

import { FriendActivity, WebTokenResponse } from '../model'
import type { SpotifyBase } from './base'
import type { Constructor } from './types'

export type FriendActivityFeature = FriendActivityEnabled | FriendActivityDisabled
export type FriendActivityEnabled = {
  friendActivity: true
  dcCookie: string

  getWebAccessToken(): Promise<string>
  getFriendActivity(): Promise<FriendActivity['friends']>
}
export type FriendActivityDisabled = {
  friendActivity: false
}

export type FriendActivityParams = {
  dcCookie: string
}

const FriendActivityEnabledMixin =
  (params: FriendActivityParams) =>
  <TBase extends Constructor<SpotifyBase>>(
    Base: TBase
  ): Constructor<FriendActivityEnabled> & TBase =>
    class extends Base implements FriendActivityEnabled {
      friendActivity = true as const
      dcCookie = params.dcCookie

      async getWebAccessToken() {
        const res = await fetch(
          'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
          {
            headers: {
              Cookie: `sp_dc=${this.dcCookie}`,
            },
          }
        )
        return WebTokenResponse.parse(await res.json()).accessToken
      }

      async getFriendActivity() {
        const token = await this.getWebAccessToken()
        const res = await got
          .get('https://guc-spclient.spotify.com/presence-view/v1/buddylist', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .json()
        return FriendActivity.parse(res).friends.reverse()
      }
    }

const FriendActivityDisabledMixin = <TBase extends Constructor<SpotifyBase>>(
  Base: TBase
): Constructor<FriendActivityDisabled> & TBase =>
  class extends Base implements FriendActivityDisabled {
    friendActivity = false as const
  }

export const FriendActivityMixin =
  (params?: FriendActivityParams) =>
  <TBase extends Constructor<SpotifyBase>>(Base: TBase) =>
    params === undefined
      ? FriendActivityDisabledMixin(Base)
      : FriendActivityEnabledMixin(params)(Base)
