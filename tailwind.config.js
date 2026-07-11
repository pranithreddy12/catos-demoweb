/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens resolve to CSS variables set per template (see index.css
        // [data-theme=...]). Switching the theme repaints every screen.
        ink: 'rgb(var(--ink) / <alpha-value>)',
        sepia: {
          DEFAULT: 'rgb(var(--sepia) / <alpha-value>)',
          soft: 'rgb(var(--sepia-soft) / <alpha-value>)',
          faint: 'rgb(var(--sepia-faint) / <alpha-value>)',
        },
        parchment: {
          DEFAULT: 'rgb(var(--parchment) / <alpha-value>)',
          50: 'rgb(var(--parchment-50) / <alpha-value>)',
          100: 'rgb(var(--parchment-100) / <alpha-value>)',
          200: 'rgb(var(--parchment-200) / <alpha-value>)',
          300: 'rgb(var(--parchment-300) / <alpha-value>)',
          edge: 'rgb(var(--parchment-edge) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          dark: 'rgb(var(--gold-dark) / <alpha-value>)',
          light: 'rgb(var(--gold-light) / <alpha-value>)',
        },
        accent: 'rgb(var(--accent) / <alpha-value>)',
        // status colors — fixed across templates
        stamp: { red: '#9e3b2e', blue: '#2f4b7c', green: '#3f6b45', purple: '#5d4474' },
        // legacy
        cream: '#FAF8F4',
        paper: '#ffffff',
        luna: { 50: '#eef4fb', 100: '#d6e6f5', 200: '#b0cdea', 400: '#5b95cf', 500: '#3a76b8', 600: '#2d5d96', 700: '#244b78' },
        moss: { 100: '#e4f0e6', 500: '#4f9d69', 700: '#2f6b45' },
        amber: { 100: '#fbeed2', 500: '#e0a23a', 700: '#a06a14' },
        rust: { 100: '#f8e0da', 500: '#d6663f', 700: '#9b3f22' },
      },
      fontFamily: {
        // Both follow the active template via CSS vars: 'serif' = display
        // font (Instrument Serif / Georgia), 'sans' = body font (Manrope / Inter).
        sans: ['var(--font-body)'],
        serif: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(20,20,20,0.06), 0 6px 20px rgba(20,20,20,0.04)',
        page: '0 2px 4px rgba(60,45,20,0.12), inset 0 0 60px rgba(150,120,70,0.10)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
}
