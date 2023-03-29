const colors = require('tailwindcss/colors')
const defaults = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    fontFamily: {
      sans: ['InterVariable', ...defaults.fontFamily.sans],
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
