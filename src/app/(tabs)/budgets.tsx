import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBudgets } from '@/features/budgets/hooks';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

const WARNING_THRESHOLD = 0.8;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
}

function parseMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return { month, year };
}

export default function Budgets() {
  const colors = useThemeColors();
  const [month, setMonth] = useState(monthKey(new Date()));
  const { month: monthNumber, year } = parseMonth(month);
  const budgets = useBudgets(monthNumber, year);

  const items = budgets.data ?? [];
  const totalBudget = items.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = items.reduce((s, b) => s + b.spent_amount, 0);
  const overCount = items.filter((b) => b.spent_amount > b.limit_amount).length;

  const stateColor = (progress: number) =>
    progress > 1 ? colors.error : progress >= WARNING_THRESHOLD ? colors.warning : colors.secondary;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={budgets.isRefetching}
            onRefresh={() => void budgets.refetch()}
            tintColor={colors.muted}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Budget</Text>
          <Pressable
            onPress={() => router.push(`/budget-form?month=${month}`)}
            className="h-10 w-10 items-center justify-center rounded-2xl bg-primary dark:bg-primary-dark active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Month picker */}
        <View className="flex-row items-center justify-between rounded-2xl bg-card px-3 py-2.5 dark:bg-card-dark">
          <Pressable onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </Pressable>
          <Text className="font-semibold text-base text-ink dark:text-ink-dark">
            {monthLabel(month)}
          </Text>
          <Pressable onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {budgets.isPending ? (
          <View className="gap-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon="pie-chart-outline"
              title="Belum ada budget"
              subtitle="Buat budget per kategori supaya pengeluaranmu terkontrol."
            />
          </Card>
        ) : (
          <>
            {/* Overview */}
            <Card className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted dark:text-muted-dark">Total terpakai</Text>
                <Text className="font-semibold text-sm text-ink dark:text-ink-dark">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </Text>
              </View>
              <ProgressBar
                progress={totalBudget > 0 ? totalSpent / totalBudget : 0}
                color={stateColor(totalBudget > 0 ? totalSpent / totalBudget : 0)}
              />
              <Text className="text-xs text-muted dark:text-muted-dark">
                Sisa {formatCurrency(Math.max(totalBudget - totalSpent, 0))} bulan ini
              </Text>
            </Card>

            {/* Insight card */}
            {overCount > 0 && (
              <Card className="flex-row items-center gap-3 border border-error/30 dark:border-error-dark/30">
                <Ionicons name="alert-circle" size={22} color={colors.error} />
                <Text className="flex-1 text-sm text-ink dark:text-ink-dark">
                  {overCount} kategori melebihi budget. Cek lagi pengeluaranmu ya!
                </Text>
              </Card>
            )}

            {/* Per-category */}
            {items.map((b) => {
              const spent = b.spent_amount;
              const progress = b.limit_amount > 0 ? spent / b.limit_amount : 0;
              const remaining = b.limit_amount - spent;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => router.push(`/budget-form?id=${b.id}&month=${month}`)}
                  className="active:opacity-80"
                >
                  <Card className="gap-3">
                    <View className="flex-row items-center gap-3">
                      <CategoryIcon category={b.category} size={40} />
                      <View className="flex-1">
                        <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                          {b.category?.name ?? 'Kategori'}
                        </Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">
                          {formatCurrency(spent)} dari {formatCurrency(b.limit_amount)}
                        </Text>
                      </View>
                      {progress > 1 ? (
                        <Text className="font-semibold text-xs text-error dark:text-error-dark">
                          Over {formatCurrency(spent - b.limit_amount)}
                        </Text>
                      ) : (
                        <Text className="font-semibold text-xs text-muted dark:text-muted-dark">
                          Sisa {formatCurrency(remaining)}
                        </Text>
                      )}
                    </View>
                    <ProgressBar progress={progress} color={stateColor(progress)} height={8} />
                  </Card>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
