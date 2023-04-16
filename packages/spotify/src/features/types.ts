// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<TResult = any, TParams extends any[] = any[]> = new (
  ...params: TParams
) => TResult
