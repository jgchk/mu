export const isDefined = <T>(value: T | undefined): value is T => value !== undefined
export const ifDefined = <T, O>(value: T | undefined, fn: (value: T) => O): O | undefined => {
  if (isDefined(value)) {
    return fn(value)
  } else {
    return undefined
  }
}
