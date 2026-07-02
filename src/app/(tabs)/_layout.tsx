import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { gradients } from '@/constants/colors';
import { useThemeColors } from '@/stores/theme';

function AddButton() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.88))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={() => router.push('/transaction-form')}
      style={{ flex: 1, alignItems: 'center' }}
    >
      <Animated.View style={[{ marginTop: -26 }, style]}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#6366F1',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
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
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transaksi',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
