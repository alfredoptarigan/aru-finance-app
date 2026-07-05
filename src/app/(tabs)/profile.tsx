import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useLogout, useMe, useUploadAvatar } from '@/features/auth/hooks';
import { BASE_URL } from '@/lib/api';
import { useThemeColors, useThemeStore, type ThemeMode } from '@/stores/theme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Terang', icon: 'sunny-outline' },
  { value: 'dark', label: 'Gelap', icon: 'moon-outline' },
  { value: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
];

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
      className="flex-row items-center gap-3 py-3.5 active:opacity-70"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15">
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
      Alert.alert('Izin dibutuhkan', 'Akses galeri dibutuhkan untuk upload foto profil.');
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
    const formData = new FormData();
    formData.append('avatar', {
      uri: asset.uri,
      name: asset.fileName ?? 'avatar.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
    uploadAvatar.mutate(formData);
  };

  const confirmLogout = () =>
    Alert.alert('Keluar?', 'Kamu harus login lagi untuk mengakses akunmu.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-2">
        <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Profil</Text>

        {/* User card */}
        <Card className="flex-row items-center gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uploadAvatar.isPending ? 'Mengupload foto profil' : 'Upload foto profil'}
            accessibilityState={{ busy: uploadAvatar.isPending, disabled: uploadAvatar.isPending }}
            disabled={uploadAvatar.isPending}
            onPress={pickAvatar}
          >
            <Avatar name={me.data?.profile.full_name} uri={avatarUri} size={64} />
            <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full bg-primary dark:bg-primary-dark">
              <Ionicons name={uploadAvatar.isPending ? 'hourglass-outline' : 'camera'} size={14} color="#fff" />
            </View>
          </Pressable>
          <View className="flex-1">
            <Text className="font-bold text-lg text-ink dark:text-ink-dark">
              {me.data?.profile.full_name ?? '…'}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark">
              {me.data?.user.email ?? ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ganti foto profil"
              accessibilityState={{ busy: uploadAvatar.isPending, disabled: uploadAvatar.isPending }}
              onPress={pickAvatar}
              disabled={uploadAvatar.isPending}
            >
              <Text className="mt-1 font-semibold text-xs text-primary dark:text-primary-dark">
                {uploadAvatar.isPending ? 'Mengupload...' : 'Ganti foto profil'}
              </Text>
            </Pressable>
            {uploadAvatar.error ? (
              <Text className="mt-1 text-xs text-error dark:text-error-dark">{uploadAvatar.error.message}</Text>
            ) : null}
          </View>
        </Card>

        {/* Theme */}
        <Card className="gap-3">
          <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Tema</Text>
          <View className="flex-row gap-2">
            {THEME_OPTIONS.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setMode(t.value)}
                className={`flex-1 items-center gap-1.5 rounded-2xl border py-3 ${
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
        </Card>

        {/* Menu */}
        <Card>
          <MenuRow icon="flag-outline" label="Target Tabungan" onPress={() => router.push('/goals')} />
          <MenuRow icon="bulb-outline" label="Insights" onPress={() => router.push('/insights')} />
          <MenuRow icon="cash-outline" label="Mata Uang" value="IDR (Rp)" />
          <MenuRow
            icon="notifications-outline"
            label="Notifikasi"
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
            label="Export Data"
            onPress={() => Alert.alert('Segera hadir', 'Fitur export data sedang disiapkan.')}
          />
        </Card>

        <Pressable
          onPress={confirmLogout}
          className="h-14 items-center justify-center rounded-2xl border border-error/40 active:opacity-70 dark:border-error-dark/40"
        >
          <Text className="font-semibold text-base text-error dark:text-error-dark">Keluar</Text>
        </Pressable>

        <Text className="text-center text-xs text-muted dark:text-muted-dark">
          FinTrack v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
