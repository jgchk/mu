import type { Options } from 'svelte-dnd-action'
import { dndzone } from 'svelte-dnd-action'

import type { Action } from './types'

export type DndOptions = Omit<Options, 'dropTargetClasses'> & {
  dropTargetClass?: string
}

const makeOptions = ({ dropTargetClass, ...options }: DndOptions): Options => ({
  ...options,
  dropTargetStyle: options.dropTargetStyle ?? {},
  dropTargetClasses: dropTargetClass?.split(' ') ?? [
    'rounded',
    'outline',
    'outline-1',
    'outline-primary-500',
  ],
})

export const dnd: Action<DndOptions> = (node, options) => {
  const action = dndzone(node, makeOptions(options))
  return {
    ...action,
    update: (options) => action.update(makeOptions(options)),
  }
}
