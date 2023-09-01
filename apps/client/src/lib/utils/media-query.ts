import { readable } from 'svelte/store'

export const useMediaQuery = (query: string) => {
  if (typeof window === 'undefined' || !query) {
    return readable(false)
  }

  const matches = readable(false, (set) => {
    const m = window.matchMedia(query)
    set(m.matches)
    const mql = (e: { matches: boolean }) => set(e.matches)
    m.addEventListener('change', mql)

    return () => {
      m.removeEventListener('change', mql)
    }
  })

  return matches
}

const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const useBreakpoint = (breakpoint: keyof typeof breakpoints) =>
  useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`)
