// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./m3u8-parser.d.ts" />

import crypto from 'crypto'
import { execa } from 'execa'
import { fileTypeStream } from 'file-type'
import fs from 'fs'
import got from 'got'
import type { Manifest } from 'm3u8-parser'
import { Parser } from 'm3u8-parser'
import os from 'os'
import path from 'path'
import stream from 'stream'

import type { Transcoding } from './model'
import { DownloadResponse, FullTrack, Pager, Playlist, TranscodingResponse } from './model'
import { getFileSize } from './utils/fs'
import { sum } from './utils/math'
import { ifDefined } from './utils/types'

export * from './model'

export type DownloadOptions = {
  pollInterval?: number
  secretToken?: string
  onProgress?: (data: { totalBytes: number; receivedBytes: number; progress: number }) => void
}

export class Soundcloud {
  private clientId: string
  private authToken: string

  constructor({ clientId, authToken }: { clientId: string; authToken: string }) {
    this.clientId = clientId
    this.authToken = authToken
  }

  async searchTracks(query: string) {
    const res = await got('https://api-v2.soundcloud.com/search/tracks', {
      searchParams: {
        q: query,
        client_id: this.clientId,
      },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    }).json()
    return Pager(FullTrack).parse(res).collection
  }

  async searchAlbums(query: string) {
    const res = await got('https://api-v2.soundcloud.com/search/albums', {
      searchParams: {
        q: query,
        client_id: this.clientId,
      },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    }).json()
    return Pager(Playlist).parse(res).collection
  }

  async getTrack(id: number) {
    const res = await got(`https://api-v2.soundcloud.com/tracks/${id}`, {
      searchParams: {
        client_id: this.clientId,
      },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    }).json()
    return FullTrack.parse(res)
  }

  async getPlaylist(id: number) {
    const res = await got(`https://api-v2.soundcloud.com/playlists/${id}`, {
      searchParams: {
        client_id: this.clientId,
      },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    }).json()
    return Playlist.parse(res)
  }

  async downloadTrack(track: FullTrack, opts?: DownloadOptions) {
    if (!track.streamable) {
      throw new Error('Track is not streamable')
    }

    if (track.policy === 'BLOCK') {
      throw new Error('Track is not available in your location')
    }

    const pipe = track.downloadable
      ? await this.downloadOriginalFile(track.id, opts?.secretToken)
      : await this.downloadHls(track, opts)

    return pipe
  }

  async downloadOriginalFile(trackId: number, secretToken?: string) {
    const url = await this.getTrackOriginalDownload(trackId, secretToken)

    const res = got.stream(url, {
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    })
    const fts = await fileTypeStream(res)
    const extension = fts.fileType?.ext
    if (!extension) {
      throw new Error('Could not determine file extension')
    }

    const output = new stream.PassThrough()
    fts.pipe(output)

    return { pipe: output, extension }
  }

  async getTrackOriginalDownload(trackId: number, secretToken?: string) {
    const result = await got(`https://api-v2.soundcloud.com/tracks/${trackId}/download`, {
      searchParams: {
        client_id: this.clientId,
        secret_token: secretToken,
      },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    })
      .json()
      .then((res) => DownloadResponse.parse(res))

    return result.redirectUri
  }

  async downloadHls(track: FullTrack, opts?: DownloadOptions) {
    if (track.media.transcodings.length === 0) {
      throw new Error(`Track ${track.id} has no transcodings`)
    }

    const transcoding = track.media.transcodings.sort(compareTranscodings)[0]
    const url = await this.getTranscodingData(transcoding)

    const extension = getExtensionFromTranscodingPreset(transcoding.preset)
    const tempFile = path.join(
      os.tmpdir(),
      `sc-${track.id}-${Date.now()}-${crypto.randomBytes(4).readUInt32LE(0)}.${extension}`
    )

    const m3u8Raw = await got(url, {
      headers: { Authorization: `OAuth ${this.authToken}` },
    }).text()

    const parser = new Parser(m3u8Raw)
    parser.push(m3u8Raw)
    parser.end()

    const m3u8 = parser.manifest
    const fileSize = await getHlsTotalBytes(m3u8)

    let interval: NodeJS.Timeout | undefined
    if (opts?.onProgress) {
      interval = setInterval(() => {
        void getFileSize(tempFile)
          .then((size) => {
            opts.onProgress?.({
              receivedBytes: size,
              totalBytes: fileSize,
              progress: size / fileSize,
            })
          })
          .catch(() => {
            // ignore
          })
      }, opts.pollInterval ?? 100)
    }

    try {
      await execa('ffmpeg', [
        '-headers',
        `Authorization: OAuth ${this.authToken}`,
        '-i',
        url,
        '-c',
        'copy',
        '-loglevel',
        'error',
        tempFile,
      ])
    } catch (e) {
      await fs.promises.rm(tempFile)
      throw e
    }

    const readPipe = fs.createReadStream(tempFile)
    readPipe.on('close', () => {
      void fs.promises.rm(tempFile)
      if (interval !== undefined) {
        clearInterval(interval)
      }
    })

    return { pipe: readPipe, extension }
  }

  async getTranscodingData(transcoding: Transcoding) {
    const res = await got(transcoding.url, {
      searchParams: { client_id: this.clientId },
      headers: {
        Authorization: `OAuth ${this.authToken}`,
      },
    })
      .json()
      .then((res) => TranscodingResponse.parse(res))
    return res.url
  }

  static getImageUrl(url: string, size: SoundcloudImageSize, extension?: SoundcloudImageFormat) {
    let output = url.replace('large', size === 'original' ? size : `t${size}x${size}`)
    if (extension !== undefined) {
      output = output.replace('.jpg', `.${extension}`)
    }
    return output
  }

  static async getLargestAvailableImage(originalUrl: string) {
    for (const size of soundcloudImageSizes.slice().reverse()) {
      for (const extension of soundcloudImageFormats) {
        try {
          const url = Soundcloud.getImageUrl(originalUrl, size, extension)
          const res = await got(url).buffer()
          return res
        } catch {
          // ignore, try next
        }
      }
    }
  }
}

export const soundcloudImageSizes = [
  20,
  40,
  47,
  50,
  60,
  67,
  80,
  120,
  200,
  240,
  250,
  300,
  500,
  2480,
  3000,
  'original',
] as const
export type SoundcloudImageSize = (typeof soundcloudImageSizes)[number]

export const soundcloudImageFormats = ['png', 'jpg'] as const
export type SoundcloudImageFormat = (typeof soundcloudImageFormats)[number]

export type DownloadResult = { pipe: stream.Readable; extension: string }

/**
 * aac: MP4 256kbps
 * mp3: MP3 128kbps
 * opus: Opus 64kbps
 */
const transcodingQualityOrder = ['aac', 'mp3', 'opus']
const compareTranscodings = (a: Transcoding, b: Transcoding) =>
  transcodingQualityOrder.indexOf(getExtensionFromTranscodingPreset(a.preset)) -
  transcodingQualityOrder.indexOf(getExtensionFromTranscodingPreset(b.preset))

const getExtensionFromTranscodingPreset = (preset: string) => {
  const ext = preset.slice(0, preset.indexOf('_'))
  if (ext === 'aac') {
    return 'mp4'
  } else {
    return ext
  }
}

const getHlsTotalBytes = async (m3u: Manifest) =>
  sum(
    await Promise.all(
      m3u.segments.map((segment) =>
        got.head(segment.uri).then((res) => ifDefined(res.headers['content-length'], parseInt) ?? 0)
      )
    )
  )
