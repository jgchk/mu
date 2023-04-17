import type { Instance, Modifier, OptionsGeneric } from '@popperjs/core'
import { createPopper } from '@popperjs/core'

import type { Action } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PopperParams = Partial<OptionsGeneric<Partial<Modifier<any, any>>>>

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
