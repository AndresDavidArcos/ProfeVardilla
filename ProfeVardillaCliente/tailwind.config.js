/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#CD1F32',
          50: '#FCE8EB',
          100: '#F9D1D7',
          200: '#F2A3AE',
          300: '#EB7586',
          400: '#E4475D',
          500: '#CD1F32',
          600: '#A41928',
          700: '#7B131E',
          800: '#520C14',
          900: '#29060A',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
