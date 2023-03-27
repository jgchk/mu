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
      console.log('update', handler_)
      handler = handler_
    },
    destroy() {
      console.log('destroy')
      document.removeEventListener('click', handleClick, true)
    },
  }
}
