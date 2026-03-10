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
        // Override slate with warm espresso/tan tones derived from banner palette
        slate: {
          50:  '#faf3ea',
          100: '#f0dcc8',
          200: '#dfc0a0',
          300: '#c9a07a',
          400: '#ab7d52',
          500: '#8c5e38',
          600: '#6b4426',
          700: '#4a2e18',
          800: '#2e1c0e',
          900: '#1c1208',
          950: '#0f0804',
        },
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
          DEFAULT: '#1c1208',
          50:  '#261810',
          100: '#301e12',
          200: '#3e281a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
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
