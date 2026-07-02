// Raw palette for props that can't take className (gradients, charts, icons).
export const palette = {
  light: {
    bg: '#F7F8FA',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    primary: '#6366F1',
    secondary: '#22C55E',
    accent: '#F97316',
    error: '#EF4444',
    warning: '#FACC15',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    bg: '#0B1120',
    card: '#111827',
    elevated: '#1F2937',
    primary: '#818CF8',
    secondary: '#34D399',
    accent: '#FB923C',
    error: '#F87171',
    warning: '#FDE047',
    text: '#F9FAFB',
    muted: '#9CA3AF',
    border: '#374151',
  },
} as const;

export const gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  income: ['#22C55E', '#14B8A6'],
  expense: ['#F97316', '#EF4444'],
  saving: ['#06B6D4', '#6366F1'],
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };
