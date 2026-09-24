/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Graphite / deep blue-grey base. A light theme can be added later by
        // re-mapping these tokens (see docs/design-system.md).
        ink: {
          950: '#06080b',
          900: '#0b0f14',
          850: '#11161d',
          800: '#161c24',
          750: '#1b222c',
          700: '#222b37',
          650: '#2a3441',
          600: '#35414f',
          500: '#4a5766',
          400: '#697889',
          300: '#8d9aaa',
          200: '#b4bfc9',
          100: '#dde3ea',
          50: '#f2f5f8',
        },
        gold: {
          700: '#8a6a1c',
          600: '#a9822a',
          500: '#c39a45',
          400: '#d9b46a',
          300: '#e8cd94',
          100: '#f6e8c9',
        },
        teal: {
          700: '#145c53',
          600: '#1a7a6d',
          500: '#2e9d8c',
          400: '#4fbfa9',
          300: '#7fd6c5',
          100: '#d6f2ec',
        },
        danger: {
          700: '#8f2f3c',
          600: '#b23c4c',
          500: '#d4596a',
          400: '#e8899a',
          300: '#f3b3c0',
          100: '#fbe3e8',
        },
        warn: {
          600: '#a8761c',
          500: '#c9922f',
          400: '#e0ad4e',
          300: '#eecb86',
          100: '#fbeed3',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          '"SF Mono"',
          'Menlo',
          'Consolas',
          '"Liberation Mono"',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 30px -18px rgba(0,0,0,0.85)',
        pop: '0 24px 60px -24px rgba(0,0,0,0.9)',
      },
      borderRadius: {
        card: '1rem',
      },
      maxWidth: {
        app: '72rem',
        content: '44rem',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
