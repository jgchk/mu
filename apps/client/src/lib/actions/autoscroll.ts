import { isElementInView } from 'utils/browser'

import type { Action } from './types'

export type AutoscrollOptions = NonNullable<
  Parameters<typeof Element.prototype.scrollIntoView>[0]
> | void

export const autoscroll: Action<AutoscrollOptions> = (el, opts) => {
  if (!isElementInView(el)) {
    el.scrollIntoView(opts ?? undefined)
  }
}
