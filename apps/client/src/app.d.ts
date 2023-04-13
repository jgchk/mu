// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  declare type Item = import('svelte-dnd-action').Item
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
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
