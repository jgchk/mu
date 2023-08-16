export const isElementInView = (el: Element, fullElement?: boolean) => {
  const rect = el.getBoundingClientRect()
  const parentRect = el.parentElement?.getBoundingClientRect()
  const parentHeight = parentRect?.height ?? window.innerHeight
  const parentWidth = parentRect?.width ?? window.innerWidth
  const height = fullElement ? rect.height : 0
  const width = fullElement ? rect.width : 0
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom - height <= parentHeight &&
    rect.right - width <= parentWidth
  )
}

export const cn = (...args: (string | false | undefined)[]) => args.filter(Boolean).join(' ')
