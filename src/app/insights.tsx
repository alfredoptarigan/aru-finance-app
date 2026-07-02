import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCharts, useInsights } from '@/features/dashboard/hooks';
import { formatCurrency, formatPercentage } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

const { width } = Dimensions.get('window');

export default function Insights() {
  const colors = useThemeColors();
  const insights = useInsights();
  const charts = useCharts();

  const data = insights.data;
  const monthlyTrend = charts.data?.monthlyTrend ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="font-bold text-xl text-ink dark:text-ink-dark">Insights</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-3.5 px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={insights.isRefetching}
            onRefresh={() => {
              void insights.refetch();
              void charts.refetch();
            }}
            tintColor={colors.muted}
          />
        }
      >
        {monthlyTrend.length > 1 && (
          <Card className="gap-3">
            <Text className="font-semibold text-base text-ink dark:text-ink-dark">
              Tren Cashflow
            </Text>
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
              height={150}
              adjustToWidth
              parentWidth={width - 88}
              initialSpacing={0}
              endSpacing={0}
              isAnimated
            />
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-1.5">
                <View className="h-2.5 w-2.5 rounded-full bg-secondary dark:bg-secondary-dark" />
                <Text className="text-xs text-muted dark:text-muted-dark">Pemasukan</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="h-2.5 w-2.5 rounded-full bg-error dark:bg-error-dark" />
                <Text className="text-xs text-muted dark:text-muted-dark">Pengeluaran</Text>
              </View>
            </View>
          </Card>
        )}

        {insights.isPending ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : !data ? (
          <Card>
            <EmptyState
              icon="bulb-outline"
              title="Belum ada insight"
              subtitle="Catat lebih banyak transaksi supaya kami bisa kasih insight keuanganmu."
            />
          </Card>
        ) : (
          <>
            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                  Ringkasan Bulan Ini
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {formatPercentage(data.savingsRate)} saving rate
                </Text>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Pemasukan</Text>
                  <Text className="mt-1 font-semibold text-sm text-ink dark:text-ink-dark">
                    {formatCurrency(data.income)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Pengeluaran</Text>
                  <Text className="mt-1 font-semibold text-sm text-ink dark:text-ink-dark">
                    {formatCurrency(data.expense)}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Perubahan income</Text>
                  <Text className="mt-1 font-semibold text-sm text-ink dark:text-ink-dark">
                    {formatPercentage(data.incomeChange, true)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Perubahan expense</Text>
                  <Text className="mt-1 font-semibold text-sm text-ink dark:text-ink-dark">
                    {formatPercentage(data.expenseChange, true)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                Insight Penting
              </Text>
              <View className="flex-row items-start gap-3">
                <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="text-sm text-ink dark:text-ink-dark">
                    Rata-rata pengeluaran harian {formatCurrency(data.avgDailyExpense)}.
                  </Text>
                  <Text className="text-sm text-ink dark:text-ink-dark">
                    Total transaksi {data.transactionCount} dengan recurring bulanan{' '}
                    {formatCurrency(data.monthlyRecurringExpense)}.
                  </Text>
                  <Text className="text-sm text-ink dark:text-ink-dark">
                    Progress goal aktif {formatPercentage(data.goalProgress)} dari {data.activeGoals}{' '}
                    target.
                  </Text>
                  {data.topCategory ? (
                    <Text className="text-sm text-ink dark:text-ink-dark">
                      Kategori terbesar: {data.topCategory.name} ({formatCurrency(data.topCategory.total)}).
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
