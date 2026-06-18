/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lx-black': '#000000',
        'lx-surface': '#0D0D0D',
        'lx-surface-2': '#111111',
        'lx-green': '#057732',
        'lx-green-dark': '#033C1F',
        'lx-green-mid': '#068F3A',
        'lx-green-glow': '#04A847',
        'lx-white': '#FFFFFF',
        'lx-muted': '#888888',
        'lx-border': '#1C1C1C',
        'lx-red': '#E53E3E',
        'lx-amber': '#D97706',
      },
      fontFamily: {
        audiowide: ['Audiowide', 'sans-serif'],
        oxanium: ['Oxanium', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
