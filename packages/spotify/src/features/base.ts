import type { SpotifyId } from '../model'

export class SpotifyBase {
  uriToUrl(uri: string) {
    const splitUri = uri.split(':')
    if (splitUri.length < 3) {
      throw new Error('Invalid Spotify URI')
    }
    const [kind, id] = splitUri.slice(1)
    return `https://open.spotify.com/${kind}/${id}`
  }

  parseUri(uri: string): SpotifyId {
    if (uri.startsWith('spotify:')) {
      const splitUri = uri.split(':')
      if (splitUri.length < 3) {
        throw new Error('Invalid Spotify URI')
      }
      return {
        kind: splitUri[1],
        id: splitUri[2],
      }
    }

    const url = new URL(uri)
    if (url.host !== 'open.spotify.com') {
      throw new Error('Invalid Spotify URL')
    }

    const path = url.pathname.split('/')
    if (path.length < 2) {
      throw new Error('Invalid Spotify URL')
    }

    return {
      kind: path[1],
      id: path[2],
    }
  }
}
