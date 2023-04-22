import type { Action } from './types'

export type AutoscrollOptions = NonNullable<
  Parameters<typeof Element.prototype.scrollIntoView>[0]
> | void

export const autoscroll: Action<AutoscrollOptions> = (el, opts) => {
  el.scrollIntoView(opts ?? undefined)
}
