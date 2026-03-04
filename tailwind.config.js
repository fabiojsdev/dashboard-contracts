/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d5e0ee',
          500: '#2a5082',
          700: '#1a3a5c',
          900: '#0f2338',
        },
        amber: {
          400: '#f0a428',
          500: '#d4870a',
          600: '#b8720a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
