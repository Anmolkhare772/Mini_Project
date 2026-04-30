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
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--color-surface-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--color-surface-high) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary-fixed': 'rgb(var(--color-on-primary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        'secondary-fixed-dim': 'rgb(var(--color-secondary-dim) / <alpha-value>)',
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        'on-surface-border': 'rgba(var(--color-on-surface), 0.08)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 12px 0 rgba(0, 209, 255, 0.3)',
        'glow-primary-hover': '0 0 20px 0 rgba(0, 209, 255, 0.5)',
        'neon-blue': '0 0 15px rgba(0, 207, 255, 0.4)',
        'neon-green': '0 0 15px rgba(0, 255, 156, 0.4)',
      },
      colors: {
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--color-surface-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--color-surface-high) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'on-primary-fixed': 'rgb(var(--color-on-primary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-tertiary) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        'secondary-fixed-dim': 'rgb(var(--color-secondary-dim) / <alpha-value>)',
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
        'on-surface-border': 'rgba(var(--color-on-surface), 0.08)',
        'cyber-neon-blue': '#00CFFF',
        'cyber-neon-green': '#00FF9C',
        'cyber-dark': '#0a0a1a',
      },
      keyframes: {
        'threat-glow': {
          '0%, 100%': { boxShadow: '0 0 5px 0 rgba(255, 59, 92, 0.3)' },
          '50%': { boxShadow: '0 0 20px 5px rgba(255, 59, 92, 0.5)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'threat-pulse': 'threat-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}
