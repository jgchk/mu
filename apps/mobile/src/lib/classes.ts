import { twMerge } from 'tailwind-merge'

export const cn = (...args: (string | false | undefined)[]) => args.filter(Boolean).join(' ')

export const tw = twMerge
