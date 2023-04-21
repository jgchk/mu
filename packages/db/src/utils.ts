export type AutoCreatedAt<T> = Omit<T, 'createdAt'>
export const withCreatedAt = <T>(
  model: AutoCreatedAt<T>
): AutoCreatedAt<T> & { createdAt: Date } => ({
  ...model,
  createdAt: new Date(),
})

export type UpdateData<T> = Partial<Omit<T, 'id'>>
export const makeUpdate = <T extends UpdateData<T>>(data: T): T =>
  Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T
