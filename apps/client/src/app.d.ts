/* eslint-disable @typescript-eslint/consistent-type-imports */

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      token?: string
      session?: NonNullable<import('trpc').AppRouterOutput['accounts']['getSession']>
    }
    // interface PageData {}
    interface Platform {
      req: import('http').IncomingMessage & {
        token?: string
      }
    }
  }

  declare type Item = import('svelte-dnd-action').Item
  declare type DndEvent<ItemType = Item> = import('svelte-dnd-action').DndEvent<ItemType>
  declare namespace svelte.JSX {
    interface HTMLAttributes<T> {
      onconsider?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void
      onfinalize?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void
    }
  }

  type AndroidMediaState =
    | {
        type: 'cafe.jake.mu.PlayerState.Idle'
      }
    | {
        type: 'cafe.jake.mu.PlayerState.Playing'
        trackId: number
        progress: number
        duration: number
        state: {
          type:
            | 'cafe.jake.mu.MediaState.Playing'
            | 'cafe.jake.mu.MediaState.Paused'
            | 'cafe.jake.mu.MediaState.Buffering'
        }
      }

  interface AppEventMap {
    mediastate: CustomEvent<AndroidMediaState>
  }

  interface Window {
    addEventListener<K extends keyof AppEventMap>(
      type: K,
      listener: (this: Document, ev: AppEventMap[K]) => void
    ): void
    removeEventListener<K extends keyof AppEventMap>(
      type: K,
      listener: (this: Document, ev: AppEventMap[K]) => void
    ): void
    dispatchEvent<K extends keyof AppEventMap>(ev: AppEventMap[K]): void

    Android?: {
      playTrack: (id: number, previousTracks: string, nextTracks: string) => void
      nextTrack: () => void
      previousTrack: () => void

      play: () => void
      pause: () => void
      seek: (time: number) => void
    }
  }
}

declare module '@tanstack/svelte-query' {
  export interface QueryOptions {
    showToast?: boolean
  }
  export interface MutationOptions {
    showToast?: boolean
  }
}

export {}
