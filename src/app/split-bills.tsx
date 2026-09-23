import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteSplitBill, useSplitBills } from '@/features/split-bills/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import { getSplitBillDisplayStatus, type SplitBill } from '@/types';

const STATUS_STYLE: Record<'Draft' | 'Final' | 'Selesai', string> = {
  Draft: 'bg-line/60 text-muted dark:bg-elevated-dark dark:text-muted-dark',
  Final: 'bg-primary/10 text-primary dark:bg-primary-dark/15 dark:text-primary-dark',
  Selesai: 'bg-secondary/15 text-secondary dark:bg-secondary-dark/20 dark:text-secondary-dark',
};

function StatusBadge({ bill }: { bill: SplitBill }) {
  const status = getSplitBillDisplayStatus(bill);
  return (
    <View className={`rounded-md px-2 py-1 ${STATUS_STYLE[status]}`}>
      <Text className="font-semibold text-[10px] uppercase tracking-wide">{status}</Text>
    </View>
  );
}

export default function SplitBills() {
  const colors = useThemeColors();
  const [page, setPage] = useState(1);
  const list = useSplitBills(page);
  const remove = useDeleteSplitBill();
  const items = list.data?.items ?? [];

  const confirmDelete = (bill: SplitBill) =>
    Alert.alert('Delete split bill?', `"${bill.merchant_name || 'This bill'}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(bill.id) },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-10 pt-2"
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={() => void list.refetch()} tintColor={colors.muted} />}
      >
        <ScreenHeader
          title="Split Bill"
          subtitle="Divide a receipt between everyone who shared it."
          back
          action={{ icon: 'add', label: 'New split bill', onPress: () => router.push('/split-bill-editor') }}
        />

        {list.isPending ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : list.isError ? (
          <View className="gap-3 rounded-xl border border-error/30 p-5 dark:border-error-dark/30">
            <EmptyState icon="cloud-offline-outline" title="History could not load" subtitle="Check your connection, then try again." />
            <Button title="Retry" variant="quiet" onPress={() => void list.refetch()} />
          </View>
        ) : items.length === 0 ? (
          <View className="gap-4 rounded-xl border border-line p-5 dark:border-line-dark">
            <EmptyState
              pixel
              icon="people-outline"
              title="No split bills yet"
              subtitle="Scan a receipt or start manually to split a bill with friends."
            />
            <Button title="New split bill" onPress={() => router.push('/split-bill-editor')} />
          </View>
        ) : (
          <>
            <View className="gap-3">
              {items.map((bill, index) => (
                <Animated.View key={bill.id} entering={FadeInDown.duration(260).delay(index * 40)}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${bill.merchant_name || 'split bill'}`}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      router.push(bill.status === 'draft' ? `/split-bill-editor?id=${bill.id}` : `/split-bill/${bill.id}`);
                    }}
                    className="gap-2 rounded-2xl border border-line bg-card p-4 active:scale-[0.98] dark:border-line-dark dark:bg-card-dark"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="font-semibold text-base text-ink dark:text-ink-dark">
                          {bill.merchant_name || 'Tanpa nama'}
                        </Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">{formatDate(bill.bill_date)}</Text>
                      </View>
                      <StatusBadge bill={bill} />
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="tabular-nums font-bold text-lg text-ink dark:text-ink-dark">{formatCurrency(bill.receipt_total)}</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${bill.merchant_name || 'split bill'}`} hitSlop={8} onPress={() => confirmDelete(bill)}>
                        <AppIcon name="delete" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <View className="flex-row items-center justify-between">
              <Button title="Previous" variant="quiet" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} className="flex-1" />
              <View className="w-3" />
              <Button
                title="Next"
                variant="quiet"
                disabled={page >= (list.data?.totalPages ?? 1)}
                onPress={() => setPage((p) => p + 1)}
                className="flex-1"
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
