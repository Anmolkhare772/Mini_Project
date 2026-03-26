/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#121318',
        'surface-container-low': '#1a1b21',
        'surface-container': '#1e1f25',
        'surface-container-high': '#292a2f',
        primary: '#00d1ff',
        'on-primary-fixed': '#001f28',
        tertiary: '#00e57a', // Cyber Green
        error: '#ff3b5c', // Critical Red
        'secondary-fixed-dim': '#8896b3',
        'on-surface': '#e3e1e9',
        'on-surface-variant': '#8896b3',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 12px 0 rgba(0, 209, 255, 0.3)',
        'glow-primary-hover': '0 0 20px 0 rgba(0, 209, 255, 0.5)',
      }
    },
  },
  plugins: [],
}
