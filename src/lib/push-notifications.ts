import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import type { Notification } from 'expo-notifications';

import { api } from '@/lib/api';

type ExpoNotifications = typeof import('expo-notifications');

async function notifications(): Promise<ExpoNotifications | null> {
  if (Constants.appOwnership === 'expo' && Platform.OS === 'android') return null;
  const mod = await import('expo-notifications');
  mod.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  return mod;
}

function projectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function redirectFromNotification(notification: Notification) {
  const type = notification.request.content.data?.type;
  if (type === 'subscription_reminder') {
    router.push('/(tabs)/subscriptions');
  }
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) return;
  const Notifications = await notifications();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('subscription-reminders', {
      name: 'Subscription reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission =
    existing.status === 'granted' ? existing : await Notifications.requestPermissionsAsync();

  if (permission.status !== 'granted') return;

  const id = projectId();
  if (!id) {
    console.warn('Expo projectId missing; push token registration skipped');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;

  await api.post('/notification-devices', {
    token,
    platform: Platform.OS,
  });
}

export function observeSubscriptionNotifications() {
  let remove = () => {};

  void notifications().then((Notifications) => {
    if (!Notifications) return;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) redirectFromNotification(response.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirectFromNotification(response.notification);
    });

    remove = () => subscription.remove();
  });

  return () => remove();
}
