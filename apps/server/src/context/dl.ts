import { Downloader } from 'downloader'
import { log } from 'log'
import type { Context } from 'trpc'

import { env } from '../env'

export const makeDownloader = (getContext: () => Context) =>
  new Downloader({ getContext, downloadDir: env.DOWNLOAD_DIR, logger: log })
