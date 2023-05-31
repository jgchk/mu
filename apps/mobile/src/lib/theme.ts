import resolveConfig from 'tailwindcss/resolveConfig'

import tailwindConfig from '../../tailwind.config.cjs'

export const twConfig = resolveConfig(tailwindConfig)
