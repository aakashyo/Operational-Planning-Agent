/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0c",
        panel: "#16161a",
        primary: "#3b82f6",
        secondary: "#1f2937",
        accent: "#6366f1",
        risk: {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#ef4444",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
