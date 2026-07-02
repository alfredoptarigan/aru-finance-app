import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/stores/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 py-12">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-line/60 dark:bg-elevated-dark">
        <Ionicons name={icon} size={28} color={colors.muted} />
      </View>
      <Text className="font-semibold text-base text-ink dark:text-ink-dark">{title}</Text>
      {subtitle ? (
        <Text className="px-8 text-center text-sm text-muted dark:text-muted-dark">{subtitle}</Text>
      ) : null}
    </View>
  );
}
