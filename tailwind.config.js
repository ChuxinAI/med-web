/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f6ee',
          100: '#c7e9d8',
          200: '#9ed7bc',
          300: '#72c59d',
          400: '#46b37d',
          500: '#219b63',
          600: '#1b7c4f',
          700: '#15603e',
          800: '#0e412c',
          900: '#08261a',
        },
        ink: '#0f172a',
        mist: '#f5f7fb',
      },
      boxShadow: {
        'soft-card': '0 20px 40px -24px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
}
