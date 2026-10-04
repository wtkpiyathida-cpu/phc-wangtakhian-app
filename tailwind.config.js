/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        moph: {
          light: '#2d8f6f',
          DEFAULT: '#1b6f53',
          dark: '#0e4a36',
        }
      }
    },
  },
  plugins: [],
}