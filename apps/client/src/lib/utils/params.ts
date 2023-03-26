import { error } from '@sveltejs/kit'

export const paramNumber = (val: string, errorMessage: string) => {
  const parsed = parseInt(val)
  if (isNaN(parsed)) {
    throw error(400, errorMessage)
  }
  return parsed
}

export const paramService = (val: string): 'soulseek' | 'soundcloud' | 'spotify' => {
  if (val === 'soulseek' || val === 'soundcloud' || val === 'spotify') {
    return val
  } else {
    throw error(400, 'Invalid service')
  }
}
