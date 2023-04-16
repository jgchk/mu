export const mapValuesRecursive = (obj: unknown, fn: (value: unknown) => unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((value) => mapValuesRecursive(value, fn))
  }
  if (obj && typeof obj === 'object') {
    if (obj instanceof Map) {
      return fn(obj)
    } else {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, mapValuesRecursive(value, fn)])
      )
    }
  }
  return fn(obj)
}

export const withProps = <T, P extends Record<string, unknown>>(something: T, props: P): T & P => {
  for (const [key, value] of Object.entries(props)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    something[key] = value
  }
  return something as T & P
}
