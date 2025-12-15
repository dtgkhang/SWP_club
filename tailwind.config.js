/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary (FPT Orange)
        primary: '#FF8A3D',
        'primary-hover': '#F97316',
        'primary-soft': '#FFF3E8',

        // Secondary (Academic Blue)
        secondary: '#2563EB',
        'secondary-soft': '#EFF6FF',

        // Neutral
        text: '#0F172A',
        'text-secondary': '#475569',
        textLight: '#64748B',
        border: '#E2E8F0',
        background: '#F8FAFC',
        card: '#FFFFFF',

        // Semantic
        success: '#22C55E',
        'success-soft': '#DCFCE7',
        warning: '#F59E0B',
        'warning-soft': '#FEF3C7',
        danger: '#EF4444',
        'danger-soft': '#FEE2E2',
        info: '#38BDF8',
        'info-soft': '#E0F2FE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
