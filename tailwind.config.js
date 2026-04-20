/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: '#17212B',
          panel: '#1E2C3A',
          surface: '#242F3D',
          accent: '#2CA5E0',
          green: '#4FAE4E',
          red: '#E53935',
          orange: '#FF9800',
          text: '#FFFFFF',
          muted: '#8B9CAF',
          border: '#2B3945',
          hover: '#2B3945',
          input: '#242F3D',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
