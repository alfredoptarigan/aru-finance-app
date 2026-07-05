import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, type Href } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { TransactionItem } from '@/components/TransactionItem';
import { AmountText } from '@/components/ui/AmountText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { gradients } from '@/constants/colors';
import { useMe } from '@/features/auth/hooks';
import { useCharts, useSummary, useTodaySummary } from '@/features/dashboard/hooks';
import { BASE_URL } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { SummaryItem, SummaryItemSeverity, TodaySummary } from '@/types';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: 'arrow-down-circle', label: 'Pemasukan', href: '/transaction-form?type=income' },
  { icon: 'arrow-up-circle', label: 'Pengeluaran', href: '/transaction-form?type=expense' },
  { icon: 'pie-chart', label: 'Budget', href: '/budget-form' },
  { icon: 'flag', label: 'Goal', href: '/goal-form' },
  { icon: 'repeat', label: 'Subscription', href: '/(tabs)/subscriptions' },
] as const;

const severityStyles: Record<
  SummaryItemSeverity,
  { icon: keyof typeof Ionicons.glyphMap; box: string }
> = {
  danger: { icon: 'warning', box: 'bg-error/15 dark:bg-error-dark/20' },
  warning: { icon: 'alert-circle', box: 'bg-accent/15 dark:bg-accent-dark/20' },
  success: {
    icon: 'checkmark-circle',
    box: 'bg-secondary/15 dark:bg-secondary-dark/20',
  },
  info: { icon: 'sparkles', box: 'bg-primary/15 dark:bg-primary-dark/20' },
};

const kindIcons: Record<SummaryItem['kind'], keyof typeof Ionicons.glyphMap> = {
  bill: 'calendar-outline',
  budget: 'pie-chart-outline',
  goal: 'flag-outline',
  cashflow: 'trending-up-outline',
};

const summaryRoutes: Record<SummaryItem['kind'], Href> = {
  bill: '/upcoming-bills',
  budget: '/(tabs)/budgets',
  goal: '/goals',
  cashflow: '/insights',
};

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay }}
    >
      {children}
    </MotiView>
  );
}

function SummaryItemCard({ item }: { item: SummaryItem }) {
  const style = severityStyles[item.severity];
  const icon = kindIcons[item.kind] ?? style.icon;
  const route = item.route ? summaryRoutes[item.kind] : null;
  const accessibilityLabel = [item.title, item.subtitle, item.amount !== null ? formatCurrency(item.amount) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !route }}
      disabled={!route}
      onPress={() => route && router.push(route)}
      className="flex-row items-center gap-3 rounded-3xl bg-white/10 p-3 active:opacity-80"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-2xl ${style.box}`}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text className="font-bold text-sm text-white" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="mt-0.5 text-xs text-white/70" numberOfLines={2}>
          {item.subtitle}
        </Text>
      </View>
      {item.amount !== null ? (
        <Text className="font-bold text-xs text-white">{formatCurrency(item.amount)}</Text>
      ) : null}
    </Pressable>
  );
}

function TodaySummaryCard({ data }: { data: TodaySummary }) {
  const colors = useThemeColors();
  const topItems = data.items.slice(0, 3);
  const topBudget = data.budgets[0];
  const topGoal = data.goals[0];

  return (
    <LinearGradient
      colors={gradients.saving}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 30, padding: 18 }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm text-white/75">Today radar</Text>
          <Text className="mt-1 font-extrabold text-3xl text-white">
            {data.bills.due_today_count > 0
              ? `${data.bills.due_today_count} tagihan hari ini`
              : 'Hari ini aman'}
          </Text>
          <Text className="mt-2 text-xs text-white/75">
            Minggu ini {formatCurrency(data.bills.due_this_week_total)} tagihan, savings rate{' '}
            {formatPercentage(data.cashflow.savings_rate)}
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-3xl bg-white/15">
          <Ionicons name="sparkles" size={24} color="#fff" />
        </View>
      </View>

      <View className="mt-5 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-white/15 p-3">
          <Text className="text-xs text-white/70">Sisa bulan ini</Text>
          <Text className="mt-1 font-bold text-base text-white">
            {formatCurrency(data.cashflow.balance_month_to_date)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-white/15 p-3">
          <Text className="text-xs text-white/70">Tagihan minggu ini</Text>
          <Text className="mt-1 font-bold text-base text-white">{data.bills.due_this_week_count}</Text>
        </View>
      </View>

      {topItems.length > 0 ? (
        <View className="mt-4 gap-2.5">
          {topItems.map((item) => (
            <SummaryItemCard key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <View className="mt-4 rounded-3xl bg-white/10 p-4">
          <Text className="font-bold text-sm text-white">Tidak ada hal mendesak</Text>
          <Text className="mt-1 text-xs text-white/70">Budget, bills, dan goal masih aman dilihat sekilas.</Text>
        </View>
      )}

      {topBudget || topGoal ? (
        <View className="mt-4 gap-3 rounded-3xl bg-white/10 p-4">
          {topBudget ? (
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-xs text-white">Budget {topBudget.category_name}</Text>
                <Text className="font-bold text-xs text-white">{formatPercentage(topBudget.usage_percent)}</Text>
              </View>
              <ProgressBar progress={topBudget.usage_percent / 100} color={colors.warning} height={6} />
            </View>
          ) : null}
          {topGoal ? (
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-xs text-white">{topGoal.title}</Text>
                <Text className="font-bold text-xs text-white">{formatPercentage(topGoal.progress_percent)}</Text>
              </View>
              <ProgressBar progress={topGoal.progress_percent / 100} color={colors.secondary} height={6} />
            </View>
          ) : null}
        </View>
      ) : null}
    </LinearGradient>
  );
}

export default function Home() {
  const colors = useThemeColors();
  const [hideBalance, setHideBalance] = useState(true);
  const me = useMe();
  const summary = useSummary();
  const todaySummary = useTodaySummary();
  const charts = useCharts();

  const refreshing = summary.isRefetching || todaySummary.isRefetching || charts.isRefetching;
  const onRefresh = () => {
    void summary.refetch();
    void todaySummary.refetch();
    void charts.refetch();
    void me.refetch();
  };

  const recentItems = summary.data?.recentTransactions.slice(0, 5) ?? [];
  const monthlyTrend = charts.data?.monthlyTrend ?? [];
  const expenseByCategory = (charts.data?.expenseByCategory ?? []).slice(0, 4);
  const totalExpenseByCategory = expenseByCategory.reduce((s, c) => s + c.total, 0);
  const profileAvatar = me.data?.profile.avatar_url;
  const avatarUri = profileAvatar
    ? profileAvatar.startsWith('http') || profileAvatar.startsWith('file:')
      ? profileAvatar
      : `${BASE_URL.replace(/\/$/, '')}/${profileAvatar.replace(/^\//, '')}`
    : undefined;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView
        contentContainerClassName="min-h-full gap-5 px-5 pb-8 pt-2"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.muted} />
        }
      >
        {/* Greeting */}
        <Section>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-muted dark:text-muted-dark">Selamat datang,</Text>
              <Text className="font-bold text-2xl text-ink dark:text-ink-dark">
                Hi, {me.data?.profile.full_name?.split(' ')[0] ?? '…'} 👋
              </Text>
            </View>
            <Link href="/(tabs)/profile" asChild>
              <Pressable>
                <Avatar name={me.data?.profile.full_name} uri={avatarUri} />
              </Pressable>
            </Link>
          </View>
        </Section>

        {/* Balance card */}
        <Section delay={60}>
          {summary.isPending ? (
            <Skeleton className="h-44 w-full rounded-3xl" />
          ) : (
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 28, padding: 22 }}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-sm text-white/70">Total Saldo</Text>
                  {hideBalance ? (
                    <Text className="mt-1 font-extrabold text-4xl text-white">Rp••••••••</Text>
                  ) : (
                    <AmountText amount={summary.data?.balance ?? 0} tone="inverse" size="xl" />
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                  onPress={() => setHideBalance((value) => !value)}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15 active:opacity-80"
                >
                  <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={22} color="#fff" />
                </Pressable>
              </View>
              <View className="mt-5 flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-white/15 p-3">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="arrow-down-circle" size={16} color="#fff" />
                    <Text className="text-xs text-white/80">Pemasukan</Text>
                  </View>
                  <Text className="mt-1 font-bold text-base text-white">
                    {hideBalance ? 'Rp••••••••' : formatCurrency(summary.data?.income ?? 0)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/15 p-3">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="arrow-up-circle" size={16} color="#fff" />
                    <Text className="text-xs text-white/80">Pengeluaran</Text>
                  </View>
                  <Text className="mt-1 font-bold text-base text-white">
                    {hideBalance ? 'Rp••••••••' : formatCurrency(summary.data?.expense ?? 0)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          )}
        </Section>

        {/* Today summary */}
        <Section delay={120}>
          {todaySummary.isPending ? (
            <Skeleton className="h-72 w-full rounded-3xl" />
          ) : todaySummary.isError ? (
            <Card className="flex-row items-center gap-3 border border-line dark:border-line-dark">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15">
                <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-sm text-ink dark:text-ink-dark">Today summary belum siap</Text>
                <Text className="mt-1 text-xs text-muted dark:text-muted-dark">
                  Backend belum mengirim `/dashboard/today-summary`.
                </Text>
              </View>
            </Card>
          ) : todaySummary.data ? (
            <TodaySummaryCard data={todaySummary.data} />
          ) : null}
        </Section>

        {/* Savings rate */}
        <Section delay={180}>
          {summary.isPending ? (
            <Skeleton className="h-16 w-full rounded-3xl" />
          ) : (
            <Card className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 dark:bg-secondary-dark/20">
                  <Ionicons name="trending-up-outline" size={20} color={colors.secondary} />
                </View>
                <Text className="font-medium text-sm text-muted dark:text-muted-dark">
                  Tingkat menabung bulan ini
                </Text>
              </View>
              <Text className="font-bold text-lg text-ink dark:text-ink-dark">
                {formatPercentage(summary.data?.savingsRate ?? 0)}
              </Text>
            </Card>
          )}
        </Section>

        {/* Quick actions */}
        <Section delay={240}>
          <View className="flex-row justify-between">
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.href)}
                className="items-center gap-1.5 active:opacity-70"
                style={{ width: (width - 40) / 5 - 6 }}
              >
                <View className="h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 dark:bg-primary-dark/15">
                  <Ionicons name={a.icon} size={24} color={colors.primary} />
                </View>
                <Text className="text-xs text-muted dark:text-muted-dark">{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Section>

        {/* Cashflow chart */}
        {monthlyTrend.length > 1 && (
          <Section delay={300}>
            <Card className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                  Cashflow
                </Text>
                <Link href="/insights" asChild>
                  <Text className="font-medium text-xs text-primary dark:text-primary-dark">
                    Lihat insight →
                  </Text>
                </Link>
              </View>
              <LineChart
                data={monthlyTrend.map((p) => ({ value: p.income, label: p.label }))}
                data2={monthlyTrend.map((p) => ({ value: p.expense }))}
                color1={colors.secondary}
                color2={colors.error}
                thickness={3}
                curved
                hideDataPoints
                hideRules
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
                height={120}
                adjustToWidth
                parentWidth={width - 88}
                initialSpacing={0}
                endSpacing={0}
                isAnimated
              />
            </Card>
          </Section>
        )}

        {/* Spending by category */}
        {expenseByCategory.length > 0 && (
          <Section delay={360}>
            <Card className="gap-4">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                Pengeluaran per Kategori
              </Text>
              {expenseByCategory.map((c) => (
                <View key={c.category_id} className="flex-row items-center gap-3">
                  <CategoryIcon category={c} size={38} />
                  <View className="flex-1 gap-1.5">
                    <View className="flex-row justify-between">
                      <Text className="font-medium text-sm text-ink dark:text-ink-dark">
                        {c.name}
                      </Text>
                      <Text className="font-semibold text-sm text-ink dark:text-ink-dark">
                        {formatCurrency(c.total)}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={totalExpenseByCategory > 0 ? c.total / totalExpenseByCategory : 0}
                      color={c.color ?? colors.primary}
                      height={6}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </Section>
        )}

        {/* Recent transactions */}
        <Section delay={420}>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                Transaksi Terakhir
              </Text>
              <Link href="/(tabs)/transactions" asChild>
                <Text className="font-medium text-xs text-primary dark:text-primary-dark">
                  Lihat semua →
                </Text>
              </Link>
            </View>
            {summary.isPending ? (
              <View className="gap-2.5">
                <Skeleton className="h-18 w-full" />
                <Skeleton className="h-18 w-full" />
                <Skeleton className="h-18 w-full" />
              </View>
            ) : recentItems.length === 0 ? (
              <Card>
                <EmptyState
                  icon="receipt-outline"
                  title="Belum ada transaksi"
                  subtitle="Tekan tombol + untuk mencatat transaksi pertamamu."
                />
              </Card>
            ) : (
              <View className="gap-2.5">
                {recentItems.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onPress={() => router.push(`/transaction/${t.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
