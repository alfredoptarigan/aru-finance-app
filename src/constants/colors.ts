// Raw palette for props that cannot take className (charts, icons, native controls).
export const palette = {
  light: {
    bg: '#F5F0E7',
    card: '#FCF8F1',
    elevated: '#EEE6D9',
    primary: '#B65F47',
    secondary: '#4F745E',
    accent: '#A66F2C',
    error: '#A9473D',
    warning: '#B98231',
    text: '#2A2723',
    muted: '#756E65',
    border: '#D9D0C3',
  },
  dark: {
    bg: '#181613',
    card: '#211E1A',
    elevated: '#2B2722',
    primary: '#D9866D',
    secondary: '#7EAA8B',
    accent: '#C8934B',
    error: '#E07A6C',
    warning: '#D2A154',
    text: '#F3ECE1',
    muted: '#B6AA9C',
    border: '#3C3730',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };
