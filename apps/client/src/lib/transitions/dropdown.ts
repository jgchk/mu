import { cubicOut } from 'svelte/easing'
import type { EasingFunction, TransitionConfig } from 'svelte/transition'

type DropdownProps = {
  delay?: number
  duration?: number
  easing?: EasingFunction
  opacitySpeed?: number
  startHeight?: number
  slideDownHeight?: number
}

export function dropdown(
  node: Element,
  {
    delay = 0,
    duration = 200,
    easing = cubicOut,
    opacitySpeed = 1,
    startHeight = 0.5,
    slideDownHeight = 4,
  }: DropdownProps = {}
): TransitionConfig {
  return {
    delay,
    duration,
    easing,
    css: (t) => {
      const style = getComputedStyle(node)
      const opacity = +style.opacity
      const primary_dimension_value = parseFloat(style.height)
      const padding_start_value = parseFloat(style.paddingTop)
      const padding_end_value = parseFloat(style.paddingBottom)
      const margin_start_value = parseFloat(style.marginTop)
      const margin_end_value = parseFloat(style.marginBottom)
      const border_width_start_value = parseFloat(style.borderTopWidth)
      const border_width_end_value = parseFloat(style.borderBottomWidth)

      const opacityT = Math.min(t * opacitySpeed, 1)
      const heightT = t * (1 - startHeight) + startHeight

      return (
        'overflow: hidden;' +
        `opacity: ${opacityT * opacity};` +
        `top: -${slideDownHeight * (1 - t)}px;` +
        `height: ${heightT * primary_dimension_value}px;` +
        `padding-top: ${heightT * padding_start_value}px;` +
        `padding-bottom: ${heightT * padding_end_value}px;` +
        `margin-top: ${heightT * margin_start_value}px;` +
        `margin-bottom: ${heightT * margin_end_value}px;` +
        `border-top-width: ${heightT * border_width_start_value}px;` +
        `border-bottom-width: ${heightT * border_width_end_value}px;`
      )
    },
  }
}
