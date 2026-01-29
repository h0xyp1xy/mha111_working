/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind v3 automatically purges unused CSS in production builds
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F7F5',
          100: '#E1EFEC',
          200: '#C3DFD9',
          300: '#A5CFC6',
          400: '#78B7AA',
          500: '#4A9B8C',
          600: '#3D8275',
          700: '#30685E',
          800: '#244E47',
          900: '#173430',
        },
        blue: {
          soft: '#6BAED6',
          calm: '#4292C6',
        },
        warm: {
          gray: '#F8F9FA',
          white: '#FDFDFD',
        },
        soft: {
          gray: '#E9ECEF',
        },
        emotional: {
          anxiety: '#FFB347',
          calm: '#4A9B8C',
          hope: '#74C69D',
          support: '#9B8CC4',
        },
      },
    },
  },
  plugins: [],
}

