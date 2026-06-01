/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // Wolvesville VN Dark Theme
        dark: {
          950: '#0a0515',
          900: '#110b25',
          800: '#1a1035',
          700: '#221644',
          600: '#2d1e56',
        },
        wolf: {
          50:  '#f0e8ff',
          100: '#dcc8ff',
          200: '#c4a0ff',
          300: '#a875ff',
          400: '#9050ff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1675',
        },
        blood: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      backgroundImage: {
        'wolf-gradient': 'linear-gradient(135deg, #1a0a2e 0%, #0d0720 50%, #1a0a2e 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(124,58,237,0.15) 0%, rgba(17,11,37,0.8) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at center top, rgba(124,58,237,0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'wolf': '0 0 20px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.8)',
        'blood': '0 0 20px rgba(244,63,94,0.4), 0 4px 20px rgba(0,0,0,0.8)',
        'glow-wolf': '0 0 40px rgba(124,58,237,0.6)',
        'glow-gold': '0 0 30px rgba(251,191,36,0.4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'howl': 'howl 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        howl: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
