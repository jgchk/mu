export const isDefined = <T>(value: T | undefined): value is T => value !== undefined
export const ifDefined = <T, O>(value: T | undefined, fn: (value: T) => O): O | undefined => {
  if (isDefined(value)) {
    return fn(value)
  } else {
    return undefined
  }
}

export const isTruthy = <T>(value: T | undefined | null | false | 0 | '' | []): value is T =>
  !!value
export const ifTruthy = <T, O>(
  value: T | undefined | null | false | 0 | '' | [],
  fn: (value: T) => O
): O | undefined => {
  if (isTruthy(value)) {
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

export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
export type DistributivePick<T, K extends keyof T> = T extends unknown ? Pick<T, K> : never
