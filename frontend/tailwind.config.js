/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050612",
        panel: "#0f1223",
        primary: "#7C3AED",
        accent: "#FB923C",
        highlight: "#22D3EE",
        secondary: "#0b1220",
        risk: {
          low: "#34D399",
          medium: "#FBBF24",
          high: "#F87171",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(124, 58, 237, 0.35)',
      },
    },
  },
  plugins: [],
}
