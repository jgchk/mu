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
