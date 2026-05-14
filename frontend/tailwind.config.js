/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0f0f0e',
          surface: '#1a1918',
          'surface-2': '#212020',
        },
        border: 'rgba(255,255,255,0.08)',
        primary: '#4f98a3',
        text: {
          primary: '#cdccca',
          muted: '#797876',
          faint: '#5a5957',
        }
      },
      fontFamily: {
        ui: ['Satoshi', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
