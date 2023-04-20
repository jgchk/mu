import type { Options } from 'svelte-dnd-action'
import { dndzone } from 'svelte-dnd-action'
import { withProps } from 'utils'

import type { Action } from './types'

export type DndOptions = Omit<Options, 'dropTargetClasses'> & {
  dropTargetClass?: string
}

const makeOptions = ({ dropTargetClass, ...options }: DndOptions): Options => ({
  ...options,
  dropTargetStyle: options.dropTargetStyle ?? dnd.defaults.dropTargetStyle,
  dropTargetClasses: (dropTargetClass ?? dnd.defaults.dropTargetClass).split(' '),
  flipDurationMs: options.flipDurationMs ?? dnd.defaults.flipDurationMs,
})

const dndBase: Action<DndOptions> = (node, options) => {
  const action = dndzone(node, makeOptions(options))
  return {
    ...action,
    update: (options) => action.update(makeOptions(options)),
  }
}

export const dnd = withProps(dndBase, {
  defaults: {
    dropTargetStyle: {},
    dropTargetClass: 'rounded outline outline-1 outline-primary-500',
    flipDurationMs: 200,
  },
} as const)
