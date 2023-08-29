export const pAll = <T, O>(
  arr: T[],
  fn?: (item: T) => Promise<O>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): T extends Promise<any> ? Promise<Awaited<T>[]> : Promise<O[]> => {
  if (fn) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return Promise.all(arr.map(fn)) as any
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return Promise.all(arr) as any
  }
}

export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

export const isFulfillfed = <T>(
  promise: PromiseSettledResult<T>
): promise is PromiseFulfilledResult<T> => promise.status === 'fulfilled'

export const isRejected = <T>(promise: PromiseSettledResult<T>): promise is PromiseRejectedResult =>
  promise.status === 'rejected'
