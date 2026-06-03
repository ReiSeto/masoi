/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Outfit', 'Inter', 'sans-serif'],
        display: ['Outfit', '"Be Vietnam Pro"', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'Inter', 'sans-serif'],
      },
      colors: {
        // === Vietnamese Heritage Palette ===
        // Đỏ Son — Cờ đỏ sao vàng, truyền thống Việt
        'vn-red': {
          50:  '#fef2f2',
          100: '#fde3e3',
          200: '#fccbcb',
          300: '#f99a9a',
          400: '#f46b6b',
          500: '#e53935',
          600: '#c62828',
          700: '#a51c1c',
          800: '#881b1b',
          900: '#711d1d',
        },
        // Vàng Kim — Sao vàng, lụa hoàng gia
        'vn-gold': {
          50:  '#fffde7',
          100: '#fff9c4',
          200: '#fff59d',
          300: '#ffe082',
          400: '#ffd54f',
          500: '#ffb300',
          600: '#ffa000',
          700: '#ff8f00',
          800: '#e65100',
          900: '#bf360c',
        },
        // Xanh Ngọc Bích — Vịnh Hạ Long, núi rừng
        'vn-jade': {
          50:  '#e0f2f1',
          100: '#b2dfdb',
          200: '#80cbc4',
          300: '#4db6ac',
          400: '#26a69a',
          500: '#009688',
          600: '#00897b',
          700: '#00695c',
          800: '#004d40',
          900: '#003730',
        },
        // Dark Theme — Gỗ mun, trầm ấm
        dark: {
          950: '#0a0812',
          900: '#12101e',
          800: '#1a1530',
          700: '#221844',
          600: '#2d1e56',
        },
        // Wolf Purple — Keep identity nhưng warm hơn
        wolf: {
          50:  '#f5f0ff',
          100: '#e6d8ff',
          200: '#ccb0ff',
          300: '#b085ff',
          400: '#9a5cff',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1675',
        },
        // Blood Red — Subtle shift
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
        'vn-gradient': 'linear-gradient(135deg, #12101e 0%, #1a0e14 40%, #12101e 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(124,58,237,0.15) 0%, rgba(17,11,37,0.8) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at center top, rgba(124,58,237,0.3) 0%, transparent 70%)',
        'vn-hero': 'radial-gradient(ellipse at center top, rgba(229,57,53,0.12) 0%, rgba(255,179,0,0.06) 30%, transparent 70%)',
        'vn-warm': 'linear-gradient(180deg, #12101e 0%, #1a0e14 50%, #12101e 100%)',
      },
      boxShadow: {
        'wolf': '0 0 20px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.8)',
        'blood': '0 0 20px rgba(244,63,94,0.4), 0 4px 20px rgba(0,0,0,0.8)',
        'glow-wolf': '0 0 40px rgba(124,58,237,0.6)',
        'glow-gold': '0 0 30px rgba(251,191,36,0.4)',
        'glow-vn-red': '0 0 30px rgba(229,57,53,0.35)',
        'glow-vn-gold': '0 0 25px rgba(255,179,0,0.3)',
        'vn-card': '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,179,0,0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'howl': 'howl 0.5s ease-in-out',
        'lotus-bloom': 'lotusBoom 4s ease-in-out infinite',
        'lantern-glow': 'lanternGlow 3s ease-in-out infinite',
        'vn-shine': 'vnShine 3s ease-in-out infinite',
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
        lotusBoom: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.8' },
          '50%': { transform: 'scale(1.1) rotate(3deg)', opacity: '1' },
        },
        lanternGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        vnShine: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
