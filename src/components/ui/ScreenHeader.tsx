import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { useThemeColors } from '@/stores/theme';

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: { icon: AppIconName; label: string; onPress: () => void };
}) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-start gap-3">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-xl border border-line active:opacity-70 dark:border-line-dark"
        >
          <AppIcon name="back" color={colors.text} />
        </Pressable>
      ) : null}
      <View className="min-w-0 flex-1">
        <Text className="font-extrabold text-3xl leading-9 text-ink dark:text-ink-dark">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-muted dark:text-muted-dark">{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          className="h-11 w-11 items-center justify-center rounded-xl bg-primary active:scale-95 dark:bg-primary-dark"
        >
          <AppIcon name={action.icon} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}
