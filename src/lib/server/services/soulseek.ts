import fs from 'fs/promises'
import path from 'path'
import slsk from 'slsk-client'
import untildify from 'untildify'
import { z } from 'zod'

import { randomInt } from '$lib/utils/random'

import { env } from '../env'

export const search = async (query: string) => {
  const results = await new Promise((resolve, reject) => {
    slsk.connect({ user: 'jombo_com__', pass: 'jombo_com__1' }, (err, client) => {
      if (err) {
        reject(err)
        return
      }

      client.search(
        {
          req: query,
          timeout: 2000,
        },
        (err, res) => {
          if (err) {
            reject(err)
            return
          }

          resolve(res)
        }
      )
    })
  })

  // slsk.disconnect()

  return SoulseekResult.array().parse(results)
}

export const download = async (file: SoulseekDownload) => {
  const filePath = path.join(untildify(env.DOWNLOAD_DIR), `slsk-${Date.now()}-${randomInt(0, 9)}`)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  console.log('1', filePath)

  const data = await new Promise((resolve, reject) => {
    slsk.connect({ user: 'jombo_com__', pass: 'jombo_com__1' }, (err, client) => {
      console.log('2', err, client)
      if (err) {
        reject(err)
        return
      }

      client.download(
        {
          file,
          path: filePath,
        },
        (err, data) => {
          console.log('3', err, data)
          if (err) {
            reject(err)
            return
          }

          resolve(data)
        }
      )
    })
  })

  console.log('4')
  // slsk.disconnect()

  console.log('5')
  return data
}

const SoulseekResult = z.object({
  user: z.string(),
  file: z.string(),
  size: z.number(),
  slots: z.boolean(),
  bitrate: z.number().optional(),
  speed: z.number(),
})

export const SoulseekDownload = z.object({
  user: z.string(),
  file: z.string(),
  size: z.number(),
})
type SoulseekDownload = z.infer<typeof SoulseekDownload>
