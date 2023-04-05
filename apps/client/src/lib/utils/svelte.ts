import type { Readable } from 'svelte/store'

export type StoreType<T extends Readable<unknown>> = T extends Readable<infer U> ? U : never
