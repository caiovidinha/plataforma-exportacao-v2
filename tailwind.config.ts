import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual B2B — tons terrosos/âmbar remetendo à castanha
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f5daa8',
          300: '#efc36e',
          400: '#e8a83a',
          500: '#d4891f',  // primária
          600: '#b86e15',
          700: '#965413',
          800: '#784217',
          900: '#623718',
          950: '#371b09',
        },
        dark: {
          DEFAULT: '#0f1923',
          50:  '#1a2836',
          100: '#1e2f40',
          200: '#243548',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
