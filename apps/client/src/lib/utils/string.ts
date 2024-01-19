import { distance } from 'fastest-levenshtein'

const compareSimilarity = (a: string, b: string, query: string) => {
  // if query is empty, sort in alphabetical order
  if (query.length === 0) {
    return a.localeCompare(b)
  }

  const aDist = distance(a, query)
  const bDist = distance(b, query)
  return aDist - bDist
}

export const sortBySimilarity = (strings: string[], query: string) => {
  const lowerQuery = query.toLowerCase()
  return strings.sort((a, b) => compareSimilarity(a.toLowerCase(), b.toLowerCase(), lowerQuery))
}

export const sortObjectsBySimilarity = <T>(
  strings: T[],
  accessor: (t: T) => string,
  query: string
) => {
  const lowerQuery = query.toLowerCase()
  return strings.sort((a, b) =>
    compareSimilarity(accessor(a).toLowerCase(), accessor(b).toLowerCase(), lowerQuery)
  )
}
