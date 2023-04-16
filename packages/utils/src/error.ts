import { isObject } from './object'

export const hasMessage = (error: unknown): error is { message: string } =>
  isObject(error) && 'message' in error && typeof error.message === 'string'

export const toErrorString = (error: unknown) => {
  if (typeof error === 'string') {
    return error
  }

  if (hasMessage(error)) {
    return error.message
  }

  return String(error)
}
