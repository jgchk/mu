import { z } from 'zod'

export type AlbumArt = z.infer<typeof albumArtSchema>
export const albumArtSchema = z.union([
  z.object({ kind: z.literal('default') }),
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('upload'), data: z.instanceof(File) }),
])
