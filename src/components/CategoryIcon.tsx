import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useThemeColors } from '@/stores/theme';

// ponytail: backend stores free-form icon names; anything unknown falls back to a tag icon
function iconName(icon?: string | null): keyof typeof Ionicons.glyphMap {
  return icon && icon in Ionicons.glyphMap
    ? (icon as keyof typeof Ionicons.glyphMap)
    : 'pricetag-outline';
}

interface CategoryIconProps {
  category?: { icon?: string | null; color?: string | null };
  size?: number;
}

export function CategoryIcon({ category, size = 44 }: CategoryIconProps) {
  const colors = useThemeColors();
  const color = category?.color ?? colors.primary;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: `${color}22`,
      }}
      className="items-center justify-center"
    >
      <Ionicons name={iconName(category?.icon)} size={size * 0.45} color={color} />
    </View>
  );
}
