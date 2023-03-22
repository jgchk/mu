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
