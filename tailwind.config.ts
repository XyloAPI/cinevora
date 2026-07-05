import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#0F0F0F',
          925: '#141414',
          900: '#1A1A1A',
          875: '#1F1F1F',
          850: '#242424',
          800: '#2A2A2A',
          750: '#303030',
          700: '#363636',
          red: {
            DEFAULT: '#E50914',
            light: '#FF1A2A',
            dark: '#B2070F',
          },
          gold: '#F5A623',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
