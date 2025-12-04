/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5', // Indigo 600
        secondary: '#10B981', // Emerald 500
        danger: '#EF4444', // Red 500
        background: '#F9FAFB', // Gray 50
        card: '#FFFFFF',
        text: '#1F2937', // Gray 800
        textLight: '#6B7280', // Gray 500
      }
    },
  },
  plugins: [],
}
