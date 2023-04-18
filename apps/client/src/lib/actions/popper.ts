import type { Instance, OptionsGeneric, StrictModifiers } from '@popperjs/core'
import { createPopper } from '@popperjs/core'

import type { Action } from './types'

export type PopperParams = Partial<OptionsGeneric<StrictModifiers>>

export type PopperElementAction = Action
export type PopperTooltipAction = Action<PopperParams>

export const createPopperAction = (): [PopperElementAction, PopperTooltipAction] => {
  let popperElement: Element | null = null
  let popperTooltip: HTMLElement | null = null
  let popperParams: PopperParams = {}
  let popper: Instance | null = null

  function initialisePopper() {
    if (popperElement && popperTooltip) {
      popper = createPopper(popperElement, popperTooltip, popperParams)
    }
  }

  function destroyPopper() {
    if (popper) {
      popper.destroy()
      popper = null
    }
  }

  const usePopperElement: PopperElementAction = (element: Element) => {
    popperElement = element
    initialisePopper()
    return {
      destroy() {
        popperElement = null
        destroyPopper()
      },
    }
  }

  const usePopperToolip: Action<PopperParams> = (element: HTMLElement, params?: PopperParams) => {
    popperTooltip = element
    popperParams = params ?? {}
    initialisePopper()

    return {
      update(newParams: PopperParams) {
        popperParams = newParams
        void popper?.setOptions(popperParams)
      },
      destroy() {
        popperTooltip = null
        destroyPopper()
      },
    }
  }

  return [usePopperElement, usePopperToolip]
}
