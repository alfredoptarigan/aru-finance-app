/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // light
        bg: '#F7F8FA',
        card: '#FFFFFF',
        primary: '#6366F1',
        secondary: '#22C55E',
        accent: '#F97316',
        error: '#EF4444',
        warning: '#FACC15',
        ink: '#111827',
        muted: '#6B7280',
        line: '#E5E7EB',
        // dark
        'bg-dark': '#0B1120',
        'card-dark': '#111827',
        'elevated-dark': '#1F2937',
        'primary-dark': '#818CF8',
        'secondary-dark': '#34D399',
        'accent-dark': '#FB923C',
        'error-dark': '#F87171',
        'warning-dark': '#FDE047',
        'ink-dark': '#F9FAFB',
        'muted-dark': '#9CA3AF',
        'line-dark': '#374151',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        extrabold: ['Inter_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
