import type { Instance, Modifier, OptionsGeneric } from '@popperjs/core'
import { createPopper } from '@popperjs/core'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PopperParams = Partial<OptionsGeneric<Partial<Modifier<any, any>>>>

export function createPopperAction() {
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

  function usePopperElement(element: Element) {
    popperElement = element
    initialisePopper()
    return {
      destroy() {
        popperElement = null
        destroyPopper()
      },
    }
  }

  function usePopperToolip(element: HTMLElement, params?: PopperParams) {
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
