export type AutoCreatedAt<T> = Omit<T, 'createdAt'>
export const withCreatedAt = <T>(
  model: AutoCreatedAt<T>
): AutoCreatedAt<T> & { createdAt: Date } => ({
  ...model,
  createdAt: new Date(),
})

export type UpdateData<T> = Partial<Omit<T, 'id'>>
