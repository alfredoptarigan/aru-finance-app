import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWallets } from '@/features/wallets/hooks';
import { walletType } from '@/features/wallets/options';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

export function WalletPicker({
  value,
  onChange,
  error,
  helper,
}: {
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
  helper?: string;
}) {
  const colors = useThemeColors();
  const wallets = useWallets();

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-medium text-sm text-ink dark:text-ink-dark">Wallet</Text>
          {helper ? <Text className="text-xs text-muted dark:text-muted-dark">{helper}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage wallets"
          onPress={() => router.push('/wallets')}
          className="min-h-11 justify-center px-1 active:opacity-70"
        >
          <Text className="font-semibold text-xs text-primary dark:text-primary-dark">Manage</Text>
        </Pressable>
      </View>

      {wallets.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : wallets.isError ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void wallets.refetch()}
          className="min-h-20 justify-center rounded-xl border border-error/40 px-4 dark:border-error-dark/40"
        >
          <Text className="font-semibold text-sm text-error dark:text-error-dark">Wallets could not load</Text>
          <Text className="text-xs text-muted dark:text-muted-dark">Tap to retry.</Text>
        </Pressable>
      ) : wallets.data?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {wallets.data.map((wallet) => {
            const selected = wallet.id === value;
            const option = walletType(wallet.type);
            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${wallet.name}, ${formatCurrency(wallet.balance)}`}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onChange(wallet.id);
                }}
                className={`min-h-24 w-44 justify-between rounded-xl border p-3 active:scale-[0.98] ${
                  selected
                    ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                    : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <AppIcon name={option.icon} size={19} color={selected ? '#fff' : colors.primary} />
                  {selected ? <AppIcon name="success" size={18} color="#fff" /> : null}
                </View>
                <View className="mt-3 min-w-0">
                  <Text numberOfLines={1} className={`font-semibold text-sm ${selected ? 'text-white' : 'text-ink dark:text-ink-dark'}`}>
                    {wallet.name}
                  </Text>
                  <Text className={`tabular-nums text-xs ${selected ? 'text-white/75' : 'text-muted dark:text-muted-dark'}`}>
                    {formatCurrency(wallet.balance)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/wallet-form')}
          className="min-h-20 flex-row items-center gap-3 rounded-xl border border-dashed border-primary px-4 active:opacity-70 dark:border-primary-dark"
        >
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15">
            <AppIcon name="add" size={20} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Create a wallet</Text>
            <Text className="text-xs text-muted dark:text-muted-dark">A wallet is required to record money movement.</Text>
          </View>
        </Pressable>
      )}
      {error ? <Text className="text-xs text-error dark:text-error-dark">{error}</Text> : null}
    </View>
  );
}
