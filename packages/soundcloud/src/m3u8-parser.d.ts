/* eslint-disable @typescript-eslint/no-explicit-any */

/** Declaration file generated by dts-gen */

declare module 'm3u8-parser' {
  export class LineStream {
    constructor(...args: any[])

    push(...args: any[]): void
  }

  export class ParseStream {
    constructor(...args: any[])

    addParser(...args: any[]): void

    addTagMapper(...args: any[]): void

    push(...args: any[]): void
  }

  export class Parser {
    constructor(...args: any[])

    addParser(...args: any[]): void

    addTagMapper(...args: any[]): void

    end(...args: any[]): void

    push(...args: any[]): void

    warnOnMissingAttributes_(...args: any[]): void

    manifest: Manifest
  }

  export type Manifest = {
    allowCache: boolean
    endList?: boolean
    mediaSequence?: number
    discontinuitySequence?: number
    playlistType?: string
    custom?: object
    playlists?: [
      {
        attributes: object
        Manifest
      }
    ]
    mediaGroups?: {
      AUDIO: {
        'GROUP-ID': {
          NAME: {
            default: boolean
            autoselect: boolean
            language: string
            uri: string
            instreamId: string
            characteristics: string
            forced: boolean
          }
        }
      }
      VIDEO: object
      'CLOSED-CAPTIONS': object
      SUBTITLES: object
    }
    dateTimeString?: string
    dateTimeObject?: Date
    targetDuration?: number
    totalDuration?: number
    discontinuityStarts: [number]
    segments: [
      {
        byterange: {
          length: number
          offset: number
        }
        duration: number
        attributes: object
        discontinuity: number
        uri: string
        timeline: number
        key: {
          method: string
          uri: string
          iv: string
        }
        map: {
          uri: string
          byterange: {
            length: number
            offset: number
          }
        }
        'cue-out': string
        'cue-out-cont': string
        'cue-in': string
        custom: object
      }
    ]
  }
}
