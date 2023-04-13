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
