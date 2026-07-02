import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/stores/theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secure?: boolean;
}

export function Input({ label, icon, error, secure = false, ...props }: InputProps) {
  const [hidden, setHidden] = useState(true);
  const colors = useThemeColors();

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="font-medium text-sm text-ink dark:text-ink-dark">{label}</Text>
      ) : null}
      <View
        className={`h-14 flex-row items-center gap-2.5 rounded-2xl border bg-card px-4 dark:bg-card-dark ${
          error ? 'border-error dark:border-error-dark' : 'border-line dark:border-line-dark'
        }`}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          className="flex-1 font-sans text-base text-ink dark:text-ink-dark"
          placeholderTextColor={colors.muted}
          secureTextEntry={secure && hidden}
          {...props}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-error dark:text-error-dark">{error}</Text> : null}
    </View>
  );
}
