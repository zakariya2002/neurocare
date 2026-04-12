/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Admin dark theme tokens — "violet très foncé"
        admin: {
          // Light mode surfaces
          'bg-light': '#ffffff',
          'surface-light': '#f9fafb',
          'border-light': '#e5e7eb',
          'text-light': '#111827',
          'muted-light': '#6b7280',
          // Dark mode surfaces (deep dark purple)
          'bg-dark': '#0f0a1a',
          'surface-dark': '#1a0f2e',
          'surface-dark-2': '#241640',
          'border-dark': '#2d1b4e',
          'text-dark': '#f9fafb',
          'muted-dark': '#9ca3af',
        },
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
