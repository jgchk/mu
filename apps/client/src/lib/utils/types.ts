export const isDefined = <T>(value: T | undefined): value is T => value !== undefined
export const ifDefined = <T, O>(value: T | undefined, fn: (value: T) => O): O | undefined => {
  if (isDefined(value)) {
    return fn(value)
  } else {
    return undefined
  }
}

export const isNotNull = <T>(value: T | null): value is T => value !== null
export const ifNotNull = <T, O>(value: T | null, fn: (value: T) => O): O | null => {
  if (isNotNull(value)) {
    return fn(value)
  } else {
    return null
  }
}

export type Timeout = ReturnType<typeof setTimeout>
