/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        njangi: {
          bg: '#F5F1E8',
          green: '#0B3D2E',
          orange: '#D48C29',
          lightGreen: '#E2F0EA',
          gray: '#555555',
          lightGray: '#E5DFD3'
        }
      },
      fontFamily: {
        // Can add custom fonts later, fallback to system strong fonts.
      }
    },
  },
  plugins: [],
}
