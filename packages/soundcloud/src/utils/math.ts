export const sum = (arr: number[]): number => {
  return arr.reduce((acc, cur) => acc + cur, 0)
}

export const numDigits = (x: number) => {
  return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1
}
