import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeColors } from '@/stores/theme';

interface ProgressBarProps {
  progress: number; // 0..1+ (values >1 are clamped visually, caller styles the color)
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 10 }: ProgressBarProps) {
  const colors = useThemeColors();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration: 600 });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={{ height, borderRadius: height / 2, backgroundColor: colors.border }}
      className="overflow-hidden"
    >
      <Animated.View
        style={[
          { height: '100%', borderRadius: height / 2, backgroundColor: color ?? colors.primary },
          animatedStyle,
        ]}
      />
    </View>
  );
}
