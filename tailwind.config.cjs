// tailwind.config.cjs
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './index.html',
    './xura-system.jsx',
    './src/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
