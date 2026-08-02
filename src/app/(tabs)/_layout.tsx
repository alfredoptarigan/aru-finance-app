import * as Haptics from 'expo-haptics';
import { router, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { useThemeColors } from '@/stores/theme';

function AddButton() {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const spring = { damping: 18, stiffness: 240, reduceMotion: ReduceMotion.System } as const;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add transaction"
      onPressIn={() => scale.set(withSpring(0.9, spring))}
      onPressOut={() => scale.set(withSpring(1, spring))}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/transaction-form');
      }}
      style={{ flex: 1, alignItems: 'center' }}
    >
      <Animated.View
        style={[
          {
            marginTop: -18,
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            borderWidth: 5,
            borderColor: colors.bg,
          },
          style,
        ]}
      >
        <AppIcon name="add" size={26} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
        },
        tabBarLabelStyle: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AppIcon name="home" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <AppIcon name="transactions" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ title: '', tabBarButton: () => <AddButton /> }}
        listeners={{ tabPress: (e) => e.preventDefault() }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <AppIcon name="budget" size={23} color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="profile" size={23} color={color} />,
        }}
      />
    </Tabs>
  );
}
