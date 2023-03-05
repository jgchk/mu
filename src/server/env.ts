import { z } from 'zod'

const envSchema = z.object({
  MODE: z.enum(['development', 'test', 'production']),
  PUBLIC_PORT: z.coerce.number(),
})

const envRes = envSchema.safeParse(import.meta.env)

if (!envRes.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(envRes.error.format(), null, 4))
  process.exit(1)
}

export const env = envRes.data
