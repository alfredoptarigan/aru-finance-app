import '../global.css';

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/lib/query-client';
import {
  observeSubscriptionNotifications,
  registerForPushNotifications,
} from '@/lib/push-notifications';
import { useAuthStore } from '@/stores/auth';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboarded);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded && status !== 'loading') void SplashScreen.hideAsync();
  }, [fontsLoaded, status]);

  useEffect(() => {
    if (status !== 'authed') return;
    return observeSubscriptionNotifications();
  }, [status]);

  useEffect(() => {
    if (status !== 'authed') return;
    void registerForPushNotifications().catch((error) => {
      console.warn('Push registration failed', error);
    });
  }, [status]);

  if (!fontsLoaded || status === 'loading') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'guest'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'authed'}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="transaction/[id]" />
            <Stack.Screen name="goals" />
            <Stack.Screen name="insights" />
            <Stack.Screen name="upcoming-bills" />
            <Stack.Screen name="wallets" />
            <Stack.Screen name="receipt-scanner" options={{ presentation: 'modal' }} />
            <Stack.Screen name="transaction-form" options={{ presentation: 'modal' }} />
            <Stack.Screen name="wallet-form" options={{ presentation: 'modal' }} />
            <Stack.Screen name="budget-form" options={{ presentation: 'modal' }} />
            <Stack.Screen name="goal-form" options={{ presentation: 'modal' }} />
            <Stack.Screen name="subscription-form" options={{ presentation: 'modal' }} />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
