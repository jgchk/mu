import { browser } from '$app/environment'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'

export const createLocalStorage = <IV extends string | undefined>(
  key: string,
  initialValue?: IV
): Writable<IV extends string ? string : string | undefined> => {
  const stored = (browser ? localStorage.getItem(key) : initialValue) ?? initialValue ?? undefined

  const content = writable<string>(stored)

  const store: Writable<string> = {
    subscribe: content.subscribe,
    set: (value) => {
      if (browser) {
        localStorage.setItem(key, value)
      }

      content.set(value)
    },
    update: (updater) => {
      content.update((oldValue) => {
        const newValue = updater(oldValue)
        if (browser) {
          localStorage.setItem(key, newValue)
        }
        return newValue
      })
    },
  }

  return store
}

export const createLocalStorageJson = <T>(key: string, initialValue?: T): Writable<T> => {
  const rawStored = browser ? localStorage.getItem(key) : null
  const stored = rawStored !== null ? (JSON.parse(rawStored) as T) : initialValue

  const content = writable<T>(stored)

  const store: Writable<T> = {
    subscribe: content.subscribe,
    set: (value) => {
      if (browser) {
        localStorage.setItem(key, JSON.stringify(value))
      }

      content.set(value)
    },
    update: (updater) => {
      content.update((oldValue) => {
        const newValue = updater(oldValue)
        if (browser) {
          localStorage.setItem(key, JSON.stringify(newValue))
        }
        return newValue
      })
    },
  }

  return store
}
