import type { Context } from 'trpc'

import { env } from '../env'
import { db } from './db'
import { dl } from './dl'
import { lfm } from './lfm'
import { sc } from './sc'
import { slsk } from './slsk'
import { sp } from './sp'

export const ctx: Context & { destroy: () => void } = {
  db,
  dl,
  sc,
  sp,
  slsk,
  lfm,
  musicDir: env.MUSIC_DIR,
  destroy: () => {
    db.close()
    dl.close()
    slsk.destroy()
  },
}
