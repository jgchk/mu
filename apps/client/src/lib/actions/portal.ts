import { tick } from 'svelte'

import type { Action } from './types'

export const portal: Action<string | HTMLElement | void> = (el, target_ = 'body') => {
  let target = target_
  let targetEl: HTMLElement | null

  async function update(newTarget: string | HTMLElement | void) {
    target = newTarget
    if (typeof target === 'string') {
      targetEl = document.querySelector(target)
      if (targetEl === null) {
        await tick()
        targetEl = document.querySelector(target)
      }
      if (targetEl === null) {
        throw new Error(`No element found matching css selector: "${target}"`)
      }
    } else if (target instanceof HTMLElement) {
      targetEl = target
    } else {
      throw new TypeError(
        `Unknown portal target type: ${
          target === null ? 'null' : typeof target
        }. Allowed types: string (CSS selector) or HTMLElement.`
      )
    }
    targetEl.appendChild(el)
    el.hidden = false
  }

  function destroy() {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }

  void update(target)

  return {
    update: (target_ = 'body') => {
      void update(target_)
    },
    destroy,
  }
}
