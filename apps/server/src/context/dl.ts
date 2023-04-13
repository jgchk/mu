import { Downloader } from 'downloader'

import { env } from '../env'
import { db } from './db'
import { sc } from './sc'
import { slsk } from './slsk'
import { sp } from './sp'

export const dl = new Downloader({ db, sc, sp, slsk, downloadDir: env.DOWNLOAD_DIR })
