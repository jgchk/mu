const colors = require('tailwindcss/colors')
const defaults = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    fontFamily: {
      ...defaults.fontFamily,
      sans: ['InterVariable', 'Noto Emoji', ...defaults.fontFamily.sans],
    },
    colors: {
      primary: colors.amber,
      secondary: colors.sky,
      gray: colors.stone,

      success: colors.green,
      info: colors.blue,
      warning: colors.yellow,
      error: colors.red,

      inherit: colors.inherit,
      current: colors.current,
      transparent: colors.transparent,
      black: colors.black,
      white: colors.white,
    },
    extend: {},
  },
  plugins: [],
}
