// tailwind.config.cjs
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './xura-system.jsx',
    './src/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
