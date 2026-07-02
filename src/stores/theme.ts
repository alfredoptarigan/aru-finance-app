import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme, useColorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { palette, type ThemeColors } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        colorScheme.set(mode);
        set({ mode });
      },
    }),
    {
      name: 'fintrack.theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) colorScheme.set(state.mode);
      },
    },
  ),
);

export function useThemeColors(): ThemeColors {
  const { colorScheme: scheme } = useColorScheme();
  return palette[scheme === 'dark' ? 'dark' : 'light'];
}
