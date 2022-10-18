module.exports = {
  content: [
    './src/*/*.svelte',
    './src/*.{html,ts,js}'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}
