export const groupBy = <T, O>(array: T[], fn: (item: T) => O): Map<O, T[]> =>
  array.reduce((map, item) => {
    const key = fn(item)
    const previous = map.get(key)
    if (!previous) {
      map.set(key, [item])
    } else {
      previous.push(item)
    }
    return map
  }, new Map<O, T[]>())

export const uniqBy = <T, O>(array: T[], key: (item: T) => O): T[] => {
  const seen = new Set<O>()
  return array.filter((item) => {
    const value = key(item)
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

export const uniq = <T>(array: T[]): T[] => {
  const seen = new Set<T>()
  return array.filter((item) => {
    if (seen.has(item)) {
      return false
    }
    seen.add(item)
    return true
  })
}
