import type { Config } from 'tailwindcss'

/**
 * Identidade Amazon Trade
 *  - `brand`: escala do verde principal #1b6145 (500→600). Usado na landing e como acento discreto no app.
 *  - `ink`: neutros frios (branco/cinza claro) que dominam o dashboard.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f2',
          100: '#d5ebdf',
          200: '#abd6bf',
          300: '#79bc9a',
          400: '#4a9d77',
          500: '#2b805d',
          600: '#1b6145',
          700: '#164e38',
          800: '#123f2e',
          900: '#0e3225',
          950: '#07201a',
        },
        ink: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e5e8eb',
          300: '#d0d5da',
          400: '#9aa3ac',
          500: '#6b7480',
          600: '#4b5560',
          700: '#353d46',
          800: '#222830',
          900: '#14181d',
        },
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(20,24,29,0.04), 0 1px 1px rgba(20,24,29,0.03)',
        pop: '0 8px 30px rgba(20,24,29,0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-in': 'fade-in .25s ease-out both' },
    },
  },
  plugins: [],
}

export default config
