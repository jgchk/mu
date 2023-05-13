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
