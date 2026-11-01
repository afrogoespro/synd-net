/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eve: {
          bg: '#080b11',
          card: '#0f141f',
          panel: '#151c2c',
          border: '#1f293d',
          gold: '#e0a938',
          blue: '#3b82f6',
          teal: '#14b8a6',
          red: '#ef4444',
          orange: '#f97316',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
