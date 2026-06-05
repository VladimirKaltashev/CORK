/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: 'var(--c-accent)',
        'brand-hover': 'var(--c-accent-hover)',
        'brand-rgb': 'var(--c-accent-rgb)',
        'brand-2': 'var(--c-brand-2)',
        surface: 'var(--c-surface)',
        'surface-2': 'var(--c-surface-2)',
        'surface-3': 'var(--c-surface-3)',
        'c-text': 'var(--c-text)',
        'c-text-dim': 'var(--c-text-dim)',
        'c-text-mute': 'var(--c-text-mute)',
        'c-border': 'var(--c-border)',
        'c-border-light': 'var(--c-border-light)',
        king: 'var(--c-king)',
        clown: 'var(--c-clown)',
        'c-bg': 'var(--c-bg)',
        'c-glow': 'var(--c-glow)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: {
        card: 'var(--r-card)',
        btn: 'var(--r-btn)',
        pill: 'var(--r-pill)',
        badge: 'var(--r-badge)',
        media: 'var(--r-media)',
      },
      boxShadow: {
        glow: 'var(--c-shadow)',
      },
    },
  },
  plugins: [],
}

