/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fefae0',
          100: '#faedcd',
          200: '#e9d5a1',
          300: '#d4a373',
          400: '#c28b56',
          500: '#a47148',
          600: '#8b5e3c',
          700: '#6b4226',
        },
        cream: {
          50: '#fffef5',
          100: '#fefce8',
          200: '#fef9c3',
        },
        warm: {
          50: '#fefaf4',
          100: '#faf5eb',
          200: '#f5edd8',
          300: '#ede0c0',
          400: '#dccfaa',
          500: '#c9b88e',
        },
        forest: {
          50: '#f0f7f0',
          100: '#d4ead4',
          200: '#a8d5a8',
          300: '#6dba6d',
          400: '#3d9e3d',
          500: '#2d7a2d',
          600: '#1f5c1f',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-in-up': 'fadeInUp 500ms ease-out',
        'slide-in-left': 'slideInLeft 300ms ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(22, 163, 74, 0.15)',
        'glow-lg': '0 0 40px rgba(22, 163, 74, 0.2)',
      },
    },
  },
  plugins: [],
};
