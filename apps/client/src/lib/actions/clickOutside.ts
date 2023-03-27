export type ClickOutsideHandler = (event: ClickOutsideEvent) => void
export type ClickOutsideEvent = MouseEvent & {
  outside: Node
}

export function clickOutside(node: Node, handler_: ClickOutsideHandler) {
  let handler = handler_

  const handleClick = (event: MouseEvent) => {
    if (
      node &&
      event.target instanceof Node &&
      !node.contains(event.target) &&
      !event.defaultPrevented
    ) {
      handler({ ...event, outside: node })
    }
  }

  document.addEventListener('click', handleClick, true)

  return {
    update(handler_: ClickOutsideHandler) {
      handler = handler_
    },
    destroy() {
      document.removeEventListener('click', handleClick, true)
    },
  }
}
