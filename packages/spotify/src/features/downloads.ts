import { execa } from 'execa'
import path from 'path'
import type { Readable } from 'stream'
import { PassThrough, Transform } from 'stream'
import type { Constructor } from 'utils'

import type { SpotifyBase } from './base'

export type DownloadsFeature = DownloadsEnabled | DownloadsDisabled
export type DownloadsEnabled = {
  downloads: true
  username: string
  password: string
  devMode: boolean
  scriptPath: string

  checkCredentials(): Promise<void>
  downloadTrack(
    trackId: string,
    opts?: {
      onProgress?: (data: { totalBytes: bigint; receivedBytes: bigint; progress: number }) => void
    }
  ): Readable
}
export type DownloadsDisabled = {
  downloads: false
}

export type DownloadsParams = {
  username: string
  password: string
  devMode?: boolean
  credentialsCachePath?: string
}

const DownloadsEnabledMixin =
  (params: DownloadsParams) =>
  <TBase extends Constructor<SpotifyBase>>(Base: TBase): Constructor<DownloadsEnabled> & TBase =>
    class extends Base implements DownloadsEnabled {
      downloads = true as const
      username = params.username
      password = params.password
      devMode = params.devMode ?? false
      scriptPath = this.devMode
        ? path.join(__dirname, '../../downloader/target/debug/spotify-download')
        : path.join(__dirname, '../../downloader/target/release/spotify-download')
      credentialsCachePath =
        params.credentialsCachePath ?? path.join(__dirname, '../../credentials_cache')

      async checkCredentials() {
        const { stderr } = await execa(this.scriptPath, [
          'check-login',
          '--username',
          this.username,
          '--password',
          this.password,
          '--credentials-cache',
          this.credentialsCachePath,
        ])
        if (stderr) {
          throw new Error(stderr)
        }
      }

      downloadTrack(
        trackId: string,
        opts?: {
          onProgress?: (data: {
            totalBytes: bigint
            receivedBytes: bigint
            progress: number
          }) => void
        }
      ) {
        const res = execa(
          this.scriptPath,
          [
            'download',
            '--username',
            this.username,
            '--password',
            this.password,
            '--credentials-cache',
            this.credentialsCachePath,
            trackId,
          ],
          { encoding: null }
        )

        const stdout = res.stdout
        if (!stdout) {
          throw new Error('No stdout')
        }
        const stderr = res.stderr
        if (!stderr) {
          throw new Error('No stderr')
        }

        const fileSizeBytes = 8

        // Create a custom transform stream to ignore the first 8 bytes of the data
        const pipeOut = new PassThrough()
        stdout.on('close', () => pipeOut.end())

        let bytesRead = 0n
        let fileSize: bigint | undefined = undefined
        const ignoreFirst8Bytes = new Transform({
          transform(chunk: Buffer, encoding, callback) {
            bytesRead += BigInt(chunk.length)

            if (fileSize === undefined) {
              if (bytesRead >= fileSizeBytes) {
                const fileSizeBuffer = chunk.subarray(0, fileSizeBytes)
                fileSize = fileSizeBuffer.readBigUInt64LE()

                chunk = chunk.subarray(fileSizeBytes)
              } else {
                return callback()
              }
            }

            opts?.onProgress?.({
              receivedBytes: bytesRead,
              totalBytes: fileSize,
              progress: Number((bytesRead * 100n) / fileSize) / 100,
            })

            this.push(chunk)

            callback()
          },
        })

        // Pipe the rest of the data to pipeOut
        stdout.pipe(ignoreFirst8Bytes).pipe(pipeOut)

        return pipeOut
      }
    }

const DownloadsDisabledMixin = <TBase extends Constructor<SpotifyBase>>(
  Base: TBase
): Constructor<DownloadsDisabled> & TBase =>
  class extends Base implements DownloadsDisabled {
    downloads = false as const
  }

export const DownloadsMixin =
  (params?: DownloadsParams) =>
  <TBase extends Constructor<SpotifyBase>>(Base: TBase) =>
    params === undefined ? DownloadsDisabledMixin(Base) : DownloadsEnabledMixin(params)(Base)
