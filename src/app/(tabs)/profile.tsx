import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useLogout, useMe, useUploadAvatar } from '@/features/auth/hooks';
import { BASE_URL } from '@/lib/api';
import { useThemeColors, useThemeStore, type ThemeMode } from '@/stores/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const AVATAR_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function MenuRow({
  icon,
  label,
  value,
  onPress,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="min-h-14 flex-row items-center gap-3 border-b border-line py-3 active:opacity-70 dark:border-line-dark"
    >
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary-dark/15">
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text className="flex-1 font-medium text-sm text-ink dark:text-ink-dark">{label}</Text>
      {right ??
        (value ? (
          <Text className="text-sm text-muted dark:text-muted-dark">{value}</Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        ) : null)}
    </Pressable>
  );
}

export default function Profile() {
  const colors = useThemeColors();
  const me = useMe();
  const logout = useLogout();
  const uploadAvatar = useUploadAvatar();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  // ponytail: local-only toggle; wire to backend/expo-notifications when the feature exists
  const [notifications, setNotifications] = useState(true);

  const profileAvatar = me.data?.profile.avatar_url;
  const normalizeAvatar = (url?: string | null) => {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('file:')) return url;
    return `${BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };
  const avatarUri = normalizeAvatar(uploadAvatar.data?.avatar_url ?? profileAvatar);

  const pickAvatar = async () => {
    if (uploadAvatar.isPending) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is needed to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const extension = AVATAR_MIME_EXT[mimeType];
    if (!extension) {
      Alert.alert('Unsupported format', 'Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
      Alert.alert('File too large', 'Profile photos can be up to 2 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', {
      uri: asset.uri,
      name: asset.fileName ?? `avatar.${extension}`,
      type: mimeType,
    } as unknown as Blob);
    uploadAvatar.mutate(formData);
  };

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-2">
        <ScreenHeader title="Profile" subtitle="Account, appearance, and preferences." />

        {/* User card */}
        <View className="flex-row items-center gap-4 border-y border-line py-5 dark:border-line-dark">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uploadAvatar.isPending ? 'Uploading profile photo' : 'Upload profile photo'}
            accessibilityState={{ busy: uploadAvatar.isPending, disabled: uploadAvatar.isPending }}
            disabled={uploadAvatar.isPending}
            onPress={pickAvatar}
          >
            <Avatar name={me.data?.profile.full_name} uri={avatarUri} size={64} />
            <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full bg-primary dark:bg-primary-dark">
              <Ionicons name={uploadAvatar.isPending ? 'hourglass-outline' : 'camera'} size={14} color="#fff" />
            </View>
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="font-bold text-lg text-ink dark:text-ink-dark">
              {me.data?.profile.full_name ?? '…'}
            </Text>
            <Text numberOfLines={1} className="text-sm text-muted dark:text-muted-dark">
              {me.data?.user.email ?? ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              accessibilityState={{ busy: uploadAvatar.isPending, disabled: uploadAvatar.isPending }}
              onPress={pickAvatar}
              disabled={uploadAvatar.isPending}
            >
              <Text className="mt-1 font-semibold text-xs text-primary dark:text-primary-dark">
                {uploadAvatar.isPending ? 'Uploading…' : 'Change profile photo'}
              </Text>
            </Pressable>
            {uploadAvatar.error ? (
              <Text className="mt-1 text-xs text-error dark:text-error-dark">{uploadAvatar.error.message}</Text>
            ) : null}
          </View>
        </View>

        {/* Theme */}
        <View className="gap-3">
          <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Appearance</Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((t) => (
              <Pressable
                key={t.value}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === t.value }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setMode(t.value);
                }}
                className={`min-h-14 flex-1 items-center gap-1.5 rounded-xl border py-3 ${
                  mode === t.value
                    ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10'
                    : 'border-line dark:border-line-dark'
                }`}
              >
                <Ionicons
                  name={t.icon}
                  size={20}
                  color={mode === t.value ? colors.primary : colors.muted}
                />
                <Text
                  className={`font-medium text-xs ${
                    mode === t.value
                      ? 'text-primary dark:text-primary-dark'
                      : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View className="border-t border-line dark:border-line-dark">
          <MenuRow icon="wallet-outline" label="Wallets" onPress={() => router.push('/wallets')} />
          <MenuRow icon="flag-outline" label="Savings goals" onPress={() => router.push('/goals')} />
          <MenuRow icon="bulb-outline" label="Insights" onPress={() => router.push('/insights')} />
          <MenuRow icon="cash-outline" label="Currency" value="IDR (Rp)" />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ true: colors.primary }}
              />
            }
          />
          <MenuRow
            icon="download-outline"
            label="Export data"
            onPress={() => Alert.alert('Coming later', 'Data export is not available yet.')}
          />
        </View>

        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-xl border border-error/40 active:opacity-70 dark:border-error-dark/40"
        >
          <Text className="font-semibold text-base text-error dark:text-error-dark">Sign out</Text>
        </Pressable>

        <Text className="text-center text-xs text-muted dark:text-muted-dark">
          Ledgeria v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
