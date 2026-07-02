import { Ionicons } from '@expo/vector-icons';
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
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
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
  { label: 'Semua', value: undefined },
  { label: 'Pemasukan', value: 'income' },
  { label: 'Pengeluaran', value: 'expense' },
] as const;

const DATE_FILTERS = [
  { label: 'Semua waktu', from: undefined },
  { label: 'Bulan ini', from: 'month' },
  { label: '30 hari', from: '30d' },
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
      className={`rounded-full border px-3.5 py-2 active:opacity-70 ${
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
    Alert.alert('Hapus transaksi?', `"${transaction.title}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteTx.mutate(transaction.id) },
    ]);

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      renderRightActions={() => (
        <View className="flex-row items-center gap-2 pl-2">
          <Pressable
            onPress={() => router.push(`/transaction-form?id=${transaction.id}`)}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 dark:bg-primary-dark/20"
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-error/15 dark:bg-error-dark/20"
          >
            <Ionicons name="trash" size={18} color={colors.error} />
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

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="gap-3 px-5 pb-3 pt-2">
        <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Transaksi</Text>
        <Input
          icon="search-outline"
          placeholder="Cari transaksi…"
          value={search}
          onChangeText={setSearch}
        />
        <View className="flex-row gap-2">
          {TYPE_FILTERS.map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              active={type === f.value}
              onPress={() => setType(f.value)}
            />
          ))}
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[undefined, ...(categories.data ?? [])] as const}
          keyExtractor={(c) => c?.id ?? 'all'}
          contentContainerClassName="gap-2"
          renderItem={({ item: c }) =>
            c === undefined ? (
              <Chip
                label="Semua kategori"
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
        <View className="flex-row gap-2">
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

      {list.isPending ? (
        <View className="gap-2.5 px-5">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-18 w-full" />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-2.5 px-5 pb-8"
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
              title="Tidak ada transaksi"
              subtitle="Coba ubah filter atau catat transaksi baru."
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
