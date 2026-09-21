/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        bone: '#FFFFFF',
        ash:  '#8C8C8C',
        dust: '#4A4A4A',
        iron: '#242424',
      },
      fontFamily: {
        sans: ['Chakra Petch', 'sans-serif'],
        mono: ['Chakra Petch', 'monospace'],
      },
    },
  },
  plugins: [],
}
