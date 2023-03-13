import contentDisposition from 'content-disposition'
import { execa } from 'execa'
import fs from 'fs/promises'
import gotDefault from 'got'
import mime from 'mime'
import path from 'path'
import { z } from 'zod'

import { ifDefined, isDefined } from '$lib/utils/types'

import { env } from '../env'

const DEFAULT_HEADERS = {
  Authorization: `OAuth ${env.SOUNDCLOUD_AUTH_TOKEN}`,
} as const
const got = gotDefault.extend({
  headers: DEFAULT_HEADERS,
})

const getScriptUrls = async () => {
  const response = await got('https://soundcloud.com').text()
  return [
    ...response.matchAll(
      /<script crossorigin src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[\da-z-]+\.js)"><\/script>/gm
    ),
  ]
    .map((match) => match[1])
    .filter(isDefined)
}

const getClientIdFromScript = async (url: string) => {
  const response = await got(url).text()
  const clientIdMatch = /client_id:"([\dA-Za-z]+)"/.exec(response)
  if (!clientIdMatch) {
    throw new Error('Client ID not found')
  }
  return clientIdMatch[1]
}

export const getClientId = async () => {
  const scriptUrls = await getScriptUrls()
  return Promise.any(scriptUrls.map((url) => getClientIdFromScript(url)))
}

export const searchTracks = (query: string) =>
  got('https://api-v2.soundcloud.com/search/tracks', {
    searchParams: {
      q: query,
      client_id: env.SOUNDCLOUD_CLIENT_ID,
    },
  })
    .json()
    .then((res) => SoundcloudPager(SoundcloudTrack).parse(res))
    .then((res) => res.collection)

export const searchAlbums = (query: string) =>
  got('https://api-v2.soundcloud.com/search/albums', {
    searchParams: {
      q: query,
      client_id: env.SOUNDCLOUD_CLIENT_ID,
    },
  })
    .json()
    .then((res) => SoundcloudPager(SoundcloudPlaylist).parse(res))
    .then((res) => res.collection)

export const getTrack = (id: number) =>
  got(`https://api-v2.soundcloud.com/tracks/${id}`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID,
    },
  })
    .json()
    .then((res) => SoundcloudTrack.parse(res))

export const getPlaylist = (id: number) =>
  got(`https://api-v2.soundcloud.com/playlists/${id}`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID,
    },
  })
    .json()
    .then((res) => SoundcloudPlaylist.parse(res))

export const getSoundcloudImageUrl = (url: string, size: 100 | 200 | 'original') =>
  url.replace('large', size === 'original' ? size : `t${size}x${size}`)

export const downloadTrack = async (track: SoundcloudTrack, secretToken?: string) => {
  if (!track.streamable) {
    throw new Error('Track is not streamable')
  }

  if (track.policy === 'BLOCK') {
    throw new Error('Track is not available in your location')
  }

  const filepath = track.downloadable
    ? await downloadOriginalFile(track.id, secretToken)
    : await downloadHls(track)

  return filepath
}

const downloadOriginalFile = async (trackId: number, secretToken?: string) => {
  const url = await getTrackOriginalDownload(trackId, secretToken)

  const res = await got(url)
  if (res.statusCode === 401) {
    throw new Error('The original file has no downloads left')
  }
  if (res.statusCode === 404) {
    throw new Error('The original file was not found')
  }

  const cdHeader = res.headers['content-disposition']
  const cdValue = ifDefined(cdHeader, (header) => contentDisposition.parse(header))
  let filename = cdValue?.parameters?.['filename*'] ?? cdValue?.parameters?.filename
  if (!filename) {
    throw new Error(`Could not get filename from content-disposition header: ${String(cdHeader)}`)
  }

  const ext = path.extname(filename)
  const extension =
    ext.length > 0
      ? ext
      : ifDefined(res.headers['content-type'], (contentType) => mime.getExtension(contentType))

  filename = `sc-${trackId}${extension ?? ''}`
  const filepath = path.resolve(path.join(env.DOWNLOAD_DIR, filename))

  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, res.rawBody)

  return filepath
}

const downloadHls = async (track: SoundcloudTrack) => {
  if (track.media.transcodings.length === 0) {
    throw new Error(`Track ${track.id} has no transcodings`)
  }

  const transcoding = track.media.transcodings.sort(compareTranscodings)[0]

  let extension: string | undefined
  if (transcoding.preset.startsWith('aac')) {
    extension = 'm4a'
  } else if (transcoding.preset.startsWith('mp3')) {
    extension = 'mp3'
  } else if (transcoding.preset.startsWith('opus')) {
    extension = 'opus'
  }
  if (extension === undefined) {
    throw new Error(`Unknown extension for preset ${transcoding.preset}`)
  }

  const filename = `sc-${track.id}.${extension}`
  const filepath = path.resolve(path.join(env.DOWNLOAD_DIR, filename))

  const url = await getTranscodingMp3(transcoding)

  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await execa('ffmpeg', [
    '-headers',
    `Authorization: OAuth ${env.SOUNDCLOUD_AUTH_TOKEN}`,
    '-i',
    url,
    '-c',
    'copy',
    filepath,
    '-loglevel',
    'error',
  ])

  return filepath
}

/**
 * aac_1_0: MP4 257kbps
 * mp3_1_0: MP3 128kbps
 * mp3_0_0: MP3 128kbps
 * opus_0_0: Opus 65kbps
 */
const compareTranscodings = (a: SoundcloudTranscoding, b: SoundcloudTranscoding) => {
  const order = ['aac_1_0', 'mp3_1_0', 'mp3_0_0', 'opus_0_0']
  return order.indexOf(a.preset) - order.indexOf(b.preset)
}

const getTranscodingMp3 = async (transcoding: SoundcloudTranscoding) => {
  const res = await got(transcoding.url, {
    searchParams: { client_id: env.SOUNDCLOUD_CLIENT_ID },
  })
    .json()
    .then((res) => SoundcloudTranscodingResponse.parse(res))
  return res.url
}

const getTrackOriginalDownload = async (trackId: number, secretToken?: string) => {
  const result = await got(`https://api-v2.soundcloud.com/tracks/${trackId}/download`, {
    searchParams: {
      client_id: env.SOUNDCLOUD_CLIENT_ID,
      secret_token: secretToken,
    },
  })
    .json()
    .then((res) => SoundcloudTrackDownload.parse(res))

  return result.redirectUri
}

const SoundcloudUser = z.object({
  username: z.string(),
})

const SoundcloudPager = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    collection: schema.array(),
  })

const SoundcloudTranscoding = z.object({
  url: z.string(),
  preset: z.string(),
  duration: z.number(),
  snipped: z.boolean(),
  format: z.object({
    protocol: z.string(),
    mime_type: z.string(),
  }),
  quality: z.string(),
})
type SoundcloudTranscoding = z.infer<typeof SoundcloudTranscoding>

const SoundcloudTrack = z.object({
  id: z.number(),
  kind: z.literal('track'),
  artwork_url: z.string().nullable(),
  title: z.string(),
  user: SoundcloudUser,
  streamable: z.boolean(),
  policy: z.string(),
  downloadable: z.boolean(),
  media: z.object({
    transcodings: SoundcloudTranscoding.array(),
  }),
})
export type SoundcloudTrack = z.infer<typeof SoundcloudTrack>

const SoundcloudTrackSimple = z.object({
  id: z.number(),
  kind: z.literal('track'),
})

const SoundcloudPlaylist = z.object({
  id: z.number(),
  kind: z.literal('playlist'),
  artwork_url: z.string().nullable(),
  title: z.string(),
  user: SoundcloudUser,
  tracks: z.union([SoundcloudTrack, SoundcloudTrackSimple]).array(),
})
export type SoundcloudPlaylist = z.infer<typeof SoundcloudPlaylist>

const SoundcloudTrackDownload = z.object({
  redirectUri: z.string(),
})

const SoundcloudTranscodingResponse = z.object({
  url: z.string(),
})
