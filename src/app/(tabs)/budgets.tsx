import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBudgetPlan, useBudgets, useRefreshBudgetPlanBalance } from '@/features/budgets/hooks';
import { ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { BudgetAllocationStatus, BudgetPlanAllocation, BudgetPlanBucket } from '@/types';

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
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
}

function parseMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return { month, year };
}

function statusText(status: BudgetAllocationStatus) {
  switch (status) {
    case 'overbudget':
      return 'Over';
    case 'exhausted':
      return 'Spent';
    case 'warning':
      return 'Watch';
    default:
      return 'On track';
  }
}

const iconAliases: Record<string, keyof typeof Ionicons.glyphMap> = {
  cart: 'cart-outline',
  car: 'car-outline',
  'fast-food': 'fast-food-outline',
  wallet: 'wallet-outline',
  saving: 'wallet-outline',
  investment: 'trending-up-outline',
  transport: 'car-outline',
};

function budgetIconName(icon?: string | null): keyof typeof Ionicons.glyphMap {
  if (!icon) return 'pricetag-outline';
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return iconAliases[icon] ?? 'pricetag-outline';
}

export default function Budgets() {
  const colors = useThemeColors();
  const [month, setMonth] = useState(monthKey(new Date()));
  const { month: monthNumber, year } = parseMonth(month);
  const plan = useBudgetPlan(monthNumber, year);
  const budgets = useBudgets(monthNumber, year);
  const refreshBalance = useRefreshBudgetPlanBalance();
  const budgetItems = budgets.data ?? [];
  const budgetPlan = plan.data;
  const isMissingPlan = plan.error instanceof ApiError && plan.error.status === 404;
  const isPlanLoadError = plan.isError && !isMissingPlan;

  const totalBudget = budgetItems.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent_amount, 0);
  const overCount = budgetItems.filter((b) => b.spent_amount > b.limit_amount).length;
  const isLoading = plan.isPending || (!budgetPlan && budgets.isPending);
  const refreshing = plan.isRefetching || budgets.isRefetching;

  const stateColor = (progress: number) =>
    progress > 1 ? colors.error : progress >= WARNING_THRESHOLD ? colors.warning : colors.secondary;

  const buckets = budgetPlan?.buckets ?? budgetPlan?.allocations ?? [];
  const overBucket = buckets.find((a) => a.status === 'overbudget');
  const exhaustedBucket = buckets.find((a) => a.status === 'exhausted');
  const savingBucket = buckets.find(
    (a) => ('bucket_key' in a ? a.bucket_key === 'investing' : a.kind !== 'expense') && a.remaining_amount > 0,
  );
  const planAlert = overBucket
    ? `${overBucket.name} is over by ${formatCurrency(Math.abs(overBucket.remaining_amount))}.`
    : exhaustedBucket
      ? `${exhaustedBucket.name} is fully spent. Pause this category for now.`
      : savingBucket
        ? `${savingBucket.name} still needs ${formatCurrency(savingBucket.remaining_amount)} this month.`
        : budgetPlan
          ? 'This month is still on track.'
          : null;

  const refresh = () => {
    void plan.refetch();
    void budgets.refetch();
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-8 pt-2"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.muted} />
        }
      >
        <ScreenHeader
          title="Budget"
          subtitle="Plan the month, then watch the actual numbers."
          action={{
            icon: budgetPlan ? 'edit' : 'add',
            label: budgetPlan ? 'Edit budget plan' : 'Create budget plan',
            onPress: () => router.push(`/budget-form?month=${month}${budgetPlan ? `&planId=${budgetPlan.id}` : ''}`),
          }}
        />

        <View className="flex-row items-center justify-between rounded-2xl bg-card px-3 py-2.5 dark:bg-card-dark">
          <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.muted} />
          </Pressable>
          <Text className="font-semibold text-base text-ink dark:text-ink-dark">{monthLabel(month)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>

        {isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : isPlanLoadError && !budgetPlan && budgetItems.length === 0 ? (
          <Card className="gap-3 border border-error/30 dark:border-error-dark/30">
            <View className="flex-row items-center gap-3">
              <Ionicons name="cloud-offline-outline" size={22} color={colors.error} />
              <View className="flex-1">
                <Text className="font-semibold text-base text-ink dark:text-ink-dark">Budget plan could not load</Text>
                <Text className="text-sm text-muted dark:text-muted-dark">Check your connection or refresh before creating a new plan.</Text>
              </View>
            </View>
          </Card>
        ) : budgetPlan ? (
          <>
            <View className="rounded-2xl bg-primary p-5 dark:bg-primary-dark">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <View className="mb-3 flex-row items-center gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-2xl bg-white/18">
                      <Ionicons name="wallet-outline" size={18} color="#fff" />
                    </View>
                    <Text className="font-semibold text-sm text-white/85">
                      {budgetPlan.source === 'balance_snapshot' ? 'Available balance snapshot' : 'Manual available amount'}
                    </Text>
                  </View>
                  <Text className="font-extrabold tabular-nums text-4xl text-white">
                    {formatCurrency(budgetPlan.available_amount)}
                  </Text>
                  {budgetPlan.balance_snapshot_at && (
                    <Text className="mt-2 text-xs text-white/75">
                      Fixed snapshot. New income does not change this plan automatically.
                    </Text>
                  )}
                </View>
                <View className="items-end gap-2">
                  <View className="rounded-2xl bg-white/18 px-3 py-2">
                    <Text className="font-semibold tabular-nums text-xs text-white">{budgetPlan.total_percent}% allocated</Text>
                  </View>
                  {budgetPlan.source === 'balance_snapshot' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Update from current balance"
                      disabled={refreshBalance.isPending}
                      onPress={() => refreshBalance.mutate(budgetPlan.id)}
                      className="rounded-2xl bg-white px-3 py-2 active:opacity-80"
                    >
                      <Text className="font-semibold text-xs text-primary">Refresh balance</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View className="mt-6 flex-row gap-5 border-t border-white/20 pt-4">
                <View className="flex-1">
                  <Text className="text-xs text-white/75">Remaining</Text>
                  <Text className="mt-1 font-bold tabular-nums text-xl text-white">
                    {formatCurrency(budgetPlan.summary.remaining_amount)}
                  </Text>
                </View>
                <View className="flex-1 border-l border-white/20 pl-5">
                  <Text className="text-xs text-white/75">Safe per day</Text>
                  <Text className="mt-1 font-bold tabular-nums text-xl text-white">
                    {formatCurrency(budgetPlan.summary.daily_safe_to_spend)}
                  </Text>
                </View>
              </View>
            </View>

            <Card className="flex-row items-center gap-3 border border-primary/10 dark:border-primary-dark/20">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15">
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              </View>
              <Text className="flex-1 text-sm text-ink dark:text-ink-dark">{planAlert}</Text>
            </Card>

            {buckets.map((allocation) => (
              <AllocationCard key={allocation.id} allocation={allocation} />
            ))}
          </>
        ) : budgetItems.length === 0 ? (
          <Card className="gap-4">
            <EmptyState
              icon="pie-chart-outline"
              title="No budget plan yet"
              subtitle="Enter this month's available money, then assign it to spending and savings."
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create budget plan"
              onPress={() => router.push(`/budget-form?month=${month}`)}
              className="items-center rounded-2xl bg-primary px-4 py-3 dark:bg-primary-dark"
            >
              <Text className="font-semibold text-white">Create budget plan</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            <Card className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted dark:text-muted-dark">Manual budget</Text>
                <Text className="font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </Text>
              </View>
              <ProgressBar
                progress={totalBudget > 0 ? totalSpent / totalBudget : 0}
                color={stateColor(totalBudget > 0 ? totalSpent / totalBudget : 0)}
              />
              <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">
                {formatCurrency(Math.max(totalBudget - totalSpent, 0))} remaining this month
              </Text>
            </Card>
            {overCount > 0 && (
              <Card className="flex-row items-center gap-3 border border-error/30 dark:border-error-dark/30">
                <Ionicons name="alert-circle" size={22} color={colors.error} />
                <Text className="flex-1 text-sm text-ink dark:text-ink-dark">
                  {overCount} {overCount === 1 ? 'category is' : 'categories are'} over budget.
                </Text>
              </Card>
            )}
            {budgetItems.map((b) => {
              const progress = b.limit_amount > 0 ? b.spent_amount / b.limit_amount : 0;
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${b.category?.name ?? 'category'} budget`}
                  onPress={() => router.push(`/budget-form?id=${b.id}&month=${month}`)}
                  className="active:opacity-80"
                >
                  <Card className="gap-3">
                    <View className="flex-row items-center gap-3">
                      <CategoryIcon category={b.category} size={40} />
                      <View className="flex-1">
                        <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                          {b.category?.name ?? 'Category'}
                        </Text>
                        <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">
                          {formatCurrency(b.spent_amount)} of {formatCurrency(b.limit_amount)}
                        </Text>
                      </View>
                      <Text className="font-semibold tabular-nums text-xs text-muted dark:text-muted-dark">
                        {formatCurrency(Math.max(b.limit_amount - b.spent_amount, 0))} left
                      </Text>
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

function AllocationCard({ allocation }: { allocation: BudgetPlanAllocation | BudgetPlanBucket }) {
  const colors = useThemeColors();
  const progress = allocation.planned_amount > 0 ? allocation.actual_amount / allocation.planned_amount : 0;
  const color =
    allocation.status === 'overbudget'
      ? colors.error
      : allocation.status === 'exhausted'
        ? colors.error
        : allocation.status === 'warning'
          ? colors.warning
          : 'bucket_key' in allocation
            ? allocation.bucket_key === 'investing'
              ? colors.secondary
              : allocation.color
            : allocation.kind === 'expense'
              ? allocation.color
              : colors.secondary;

  return (
    <View className="gap-3 border-b border-line py-4 dark:border-line-dark">
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${allocation.color}22` }}
        >
          <Ionicons name={budgetIconName(allocation.icon)} size={24} color={allocation.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-base text-ink dark:text-ink-dark">{allocation.name}</Text>
            <Text className="rounded-md bg-bg px-2 py-0.5 font-semibold tabular-nums text-[11px] text-muted dark:bg-bg-dark dark:text-muted-dark">
              {allocation.percent}%
            </Text>
          </View>
          <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">
            {formatCurrency(allocation.actual_amount)} of {formatCurrency(allocation.planned_amount)}
          </Text>
        </View>
        <Text style={{ color }} className="font-bold text-xs">
          {statusText(allocation.status)}
        </Text>
      </View>
      <ProgressBar progress={progress} color={color} height={8} />
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted dark:text-muted-dark">
          {'bucket_key' in allocation && allocation.bucket_key === 'investing' ? 'Goal remaining' : 'Available'}
        </Text>
        <Text className="font-semibold tabular-nums text-xs text-ink dark:text-ink-dark">
          {formatCurrency(Math.max(allocation.remaining_amount, 0))}
        </Text>
      </View>
      {'category_names' in allocation && allocation.category_names.length > 0 ? (
        <Text className="text-xs text-muted dark:text-muted-dark">
          Categories: {allocation.category_names.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}
