import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { PixelMark } from '@/components/PixelMark';
import { useThemeColors } from '@/stores/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  pixel?: boolean;
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, pixel = false }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="items-center gap-2 py-12">
      {pixel ? (
        <PixelMark size={92} />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-line/60 dark:bg-elevated-dark">
          <Ionicons name={icon} size={26} color={colors.muted} />
        </View>
      )}
      <Text className="font-semibold text-base text-ink dark:text-ink-dark">{title}</Text>
      {subtitle ? (
        <Text className="px-8 text-center text-sm text-muted dark:text-muted-dark">{subtitle}</Text>
      ) : null}
    </View>
  );
}
