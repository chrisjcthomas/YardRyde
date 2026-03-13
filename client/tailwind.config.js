/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#17a14e',
        'primary-dark': '#12823e',
        'hackathon-bg': '#1a3a2e',
        'card-bg': '#142d24',
        'accent-yellow': '#FFD700',
        'background-light': '#f6f8f7',
        'background-dark': '#112117',
        'neutral-surface': '#e8ebe9',
        'neutral-surface-dark': '#1a2e22',
      },
      fontFamily: {
        display: ['Public Sans', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
