/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#6366F1',
        'secondary': '#4F46E5',
        'accent': '#818CF8',
      }
    },
  },
  plugins: [],
}
