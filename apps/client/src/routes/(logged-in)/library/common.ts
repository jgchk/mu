export const withSearchQuery = (pathname: string, searchQuery: string | undefined) => {
  let url = pathname
  if (searchQuery) {
    url += `?q=${searchQuery}`
  }
  return url
}
