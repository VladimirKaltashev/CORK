/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Royal Arena — Dark Theme
        'ra-bg': {
          base: '#0a0a0f',
          elevated: '#12121a',
          surface: '#1a1a25',
          hover: '#22222f',
        },
        'ra-border': {
          DEFAULT: '#2a2a3a',
          light: '#3a3a4a',
        },
        'ra-accent': {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          glow: 'rgba(124, 58, 237, 0.3)',
        },
        'ra-gold': {
          DEFAULT: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.3)',
        },
        'ra-danger': {
          DEFAULT: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.3)',
        },
        'ra-success': {
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.3)',
        },
        'ra-text': {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'ra-glow': '0 0 20px rgba(124, 58, 237, 0.15)',
        'ra-glow-strong': '0 0 30px rgba(124, 58, 237, 0.25)',
        'ra-gold': '0 0 20px rgba(245, 158, 11, 0.15)',
        'ra-card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'ra-card-hover': '0 8px 32px rgba(124, 58, 237, 0.15)',
      },
      borderRadius: {
        'ra': '16px',
        'ra-sm': '12px',
        'ra-lg': '20px',
      },
      animation: {
        'ra-pulse': 'ra-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ra-shimmer': 'ra-shimmer 2s linear infinite',
        'ra-glow': 'ra-glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'ra-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'ra-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ra-glow': {
          '0%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.1)' },
          '100%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
