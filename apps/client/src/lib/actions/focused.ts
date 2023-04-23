import type { Action } from './types'

export const focused: Action<boolean> = (el, enabled = true) => {
  const run = (enabled: boolean) => {
    if (enabled) {
      el.focus()
    }
  }

  run(enabled)

  return {
    update: (enabled = true) => {
      run(enabled)
    },
  }
}
