export const withinLastMinutes = (date: Date, minutes: number) => {
  return new Date().getTime() - date.getTime() < minutes * 60 * 1000
}
