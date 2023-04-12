export const withinLastMinutes = (date: Date, minutes: number) => {
  return new Date().getTime() - date.getTime() < minutes * 60 * 1000
}

export const compareDates = (a: Date, b: Date) => {
  return a.getTime() - b.getTime()
}
