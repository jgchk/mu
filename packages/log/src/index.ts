import type { DestinationStream, LoggerOptions } from 'pino'
import pino from 'pino'

export type Log = ReturnType<typeof pino>

const args: LoggerOptions | DestinationStream = {
  level: process.env.LEVEL ?? 'info',
}
if (process.env.NODE_ENV === 'development') {
  args.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  }
}

export const log = pino(args)
