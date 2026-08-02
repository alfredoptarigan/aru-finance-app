import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWallets } from '@/features/wallets/hooks';
import { walletType } from '@/features/wallets/options';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

export default function Wallets() {
  const colors = useThemeColors();
  const wallets = useWallets();
  const items = wallets.data ?? [];
  const total = items.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={wallets.isRefetching}
            onRefresh={() => void wallets.refetch()}
            tintColor={colors.muted}
          />
        }
      >
        <ScreenHeader
          title="Wallets"
          subtitle="Accounts that receive or fund every ledger entry."
          back
          action={{ icon: 'add', label: 'Add wallet', onPress: () => router.push('/wallet-form') }}
        />

        {wallets.isPending ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : wallets.isError ? (
          <View className="gap-3 rounded-xl border border-error/30 p-5 dark:border-error-dark/30">
            <EmptyState
              icon="cloud-offline-outline"
              title="Wallets could not load"
              subtitle="Check your connection, then try again."
            />
            <Button title="Retry" variant="quiet" onPress={() => void wallets.refetch()} />
          </View>
        ) : items.length === 0 ? (
          <View className="gap-4 rounded-xl border border-line p-5 dark:border-line-dark">
            <EmptyState
              pixel
              icon="wallet-outline"
              title="No wallets yet"
              subtitle="Add cash, bank, card, or e-wallet balances before recording transactions."
            />
            <Button title="Add wallet" onPress={() => router.push('/wallet-form')} />
          </View>
        ) : (
          <>
            <View className="rounded-2xl bg-ink p-5 dark:bg-card-dark">
              <Text className="text-sm text-white/70">Combined balance</Text>
              <Text className="mt-1 font-extrabold tabular-nums text-4xl text-white">
                {formatCurrency(total)}
              </Text>
              <Text className="mt-4 text-xs text-white/65">{items.length} active {items.length === 1 ? 'wallet' : 'wallets'}</Text>
            </View>

            <View className="border-t border-line dark:border-line-dark">
              {items.map((wallet) => {
                const option = walletType(wallet.type);
                return (
                  <Pressable
                    key={wallet.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${wallet.name}`}
                    onPress={() => router.push(`/wallet-form?id=${wallet.id}`)}
                    className="min-h-20 flex-row items-center gap-3 border-b border-line py-3 active:opacity-70 dark:border-line-dark"
                  >
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15">
                      <AppIcon name={option.icon} color={colors.primary} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="font-semibold text-base text-ink dark:text-ink-dark">{wallet.name}</Text>
                      <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
                        {option.label}{wallet.account_number ? `, ${wallet.account_number}` : ''}
                      </Text>
                    </View>
                    <View className="shrink-0 items-end">
                      <Text className="font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">{formatCurrency(wallet.balance)}</Text>
                      <AppIcon name="chevronRight" size={16} color={colors.muted} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
