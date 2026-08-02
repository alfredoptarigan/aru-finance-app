import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TransactionItem } from '@/components/TransactionItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useCategories,
  useDeleteTransaction,
  useTransactions,
  type TransactionFilters,
} from '@/features/transactions/hooks';
import { useThemeColors } from '@/stores/theme';
import type { Transaction } from '@/types';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
] as const;

const DATE_FILTERS = [
  { label: 'Any time', from: undefined },
  { label: 'This month', from: 'month' },
  { label: 'Last 30 days', from: '30d' },
] as const;

function dateRange(preset?: string): { start_date?: string; end_date?: string } {
  const now = new Date();
  if (preset === 'month') {
    return {
      start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    };
  }
  if (preset === '30d') {
    return { start_date: new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10) };
  }
  return {};
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`min-h-10 justify-center rounded-lg border px-3.5 py-2 active:opacity-70 ${
        active
          ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
          : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
      }`}
    >
      <Text
        className={`font-medium text-xs ${
          active ? 'text-white' : 'text-muted dark:text-muted-dark'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SwipeableRow({ transaction }: { transaction: Transaction }) {
  const colors = useThemeColors();
  const deleteTx = useDeleteTransaction();

  const confirmDelete = () =>
    Alert.alert('Delete transaction?', `"${transaction.title}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTx.mutate(transaction.id) },
    ]);

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      renderRightActions={() => (
        <View className="flex-row items-center gap-2 pl-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${transaction.title}`}
            onPress={() => router.push(`/transaction-form?id=${transaction.id}`)}
            className="h-11 w-11 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary-dark/20"
          >
            <AppIcon name="edit" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${transaction.title}`}
            onPress={confirmDelete}
            className="h-11 w-11 items-center justify-center rounded-xl bg-error/15 dark:bg-error-dark/20"
          >
            <AppIcon name="delete" size={18} color={colors.error} />
          </Pressable>
        </View>
      )}
    >
      <TransactionItem
        transaction={transaction}
        onPress={() => router.push(`/transaction/${transaction.id}`)}
      />
    </ReanimatedSwipeable>
  );
}

export default function Transactions() {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState<'income' | 'expense' | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [datePreset, setDatePreset] = useState<string | undefined>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filters: TransactionFilters = {
    search: debouncedSearch || undefined,
    type,
    category_id: categoryId,
    ...dateRange(datePreset),
  };

  const list = useTransactions(filters);
  const categories = useCategories();
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const categoryLabel = categories.data?.find((c) => c.id === categoryId)?.name ?? 'All categories';
  const typeLabel = TYPE_FILTERS.find((f) => f.value === type)?.label ?? 'All';
  const dateLabel = DATE_FILTERS.find((f) => f.from === datePreset)?.label ?? 'Any time';
  const hasFilters = !!type || !!categoryId || !!datePreset;
  const resetFilters = () => {
    setType(undefined);
    setCategoryId(undefined);
    setDatePreset(undefined);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="gap-3 px-5 pb-3 pt-2">
        <View className="flex-row items-start gap-3">
          <View className="min-w-0 flex-1">
            <ScreenHeader title="Transactions" subtitle="Search, filter, or swipe an entry to edit it." />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filtersOpen ? 'Hide filters' : 'Show filters'}
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => setFiltersOpen((open) => !open)}
            className={`h-11 w-11 shrink-0 items-center justify-center rounded-xl active:opacity-70 ${
              filtersOpen || hasFilters
                ? 'bg-primary dark:bg-primary-dark'
                : 'bg-card dark:bg-card-dark'
            }`}
          >
            <AppIcon name="filter" size={22} color={filtersOpen || hasFilters ? '#fff' : colors.muted} />
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <Input
              icon="search-outline"
              placeholder="Search transactions"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan receipt"
            onPress={() => router.push('/receipt-scanner')}
            className="h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink active:scale-[0.98] dark:bg-card-dark"
          >
            <AppIcon name="scan" size={23} color="#fff" />
          </Pressable>
        </View>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {typeLabel} · {categoryLabel} · {dateLabel}
        </Text>
        {filtersOpen ? (
          <View className="gap-4 border-y border-line py-4 dark:border-line-dark">
            <View className="gap-2">
              <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {TYPE_FILTERS.map((f) => (
                  <Chip
                    key={f.label}
                    label={f.label}
                    active={type === f.value}
                    onPress={() => setType(f.value)}
                  />
                ))}
              </View>
            </View>
            <View className="gap-2">
              <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Category</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[undefined, ...(categories.data ?? [])] as const}
                keyExtractor={(c) => c?.id ?? 'all'}
                contentContainerClassName="gap-2"
                renderItem={({ item: c }) =>
                  c === undefined ? (
                    <Chip
                      label="All categories"
                      active={!categoryId}
                      onPress={() => setCategoryId(undefined)}
                    />
                  ) : (
                    <Chip
                      label={c.name}
                      active={categoryId === c.id}
                      onPress={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
                    />
                  )
                }
              />
            </View>
            <View className="gap-2">
              <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Date</Text>
              <View className="flex-row flex-wrap gap-2">
                {DATE_FILTERS.map((f) => (
                  <Chip
                    key={f.label}
                    label={f.label}
                    active={datePreset === f.from}
                    onPress={() => setDatePreset(f.from)}
                  />
                ))}
              </View>
            </View>
            {hasFilters ? (
              <Pressable onPress={resetFilters} className="self-start active:opacity-70">
                <Text className="font-semibold text-xs text-error dark:text-error-dark">
                  Reset filters
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {list.isError ? (
        <View className="px-5">
          <EmptyState
            icon="cloud-offline-outline"
            title="Transactions could not load"
            subtitle="Check your connection and try again."
          />
          <Button title="Try again" variant="quiet" onPress={() => void list.refetch()} />
        </View>
      ) : list.isPending ? (
        <View className="gap-2.5 px-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-18 w-full" />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerClassName="px-5 pb-8"
          renderItem={({ item }) => <SwipeableRow transaction={item} />}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={colors.muted}
            />
          }
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No transactions found"
              subtitle="Change the filters or add a new transaction."
            />
          }
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <ActivityIndicator className="py-4" color={colors.muted} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
