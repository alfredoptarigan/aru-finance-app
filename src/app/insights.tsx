import { Ionicons } from '@expo/vector-icons';
import { Dimensions, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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
      <View className="px-5 py-4">
        <ScreenHeader title="Insights" subtitle="A concise read on this month's cash flow." back />
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
              Cash-flow trend
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
              xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
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
                <Text className="text-xs text-muted dark:text-muted-dark">Income</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <View className="h-2.5 w-2.5 rounded-full bg-error dark:bg-error-dark" />
                <Text className="text-xs text-muted dark:text-muted-dark">Expense</Text>
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
              title="No insights yet"
              subtitle="Add more transactions to build a useful monthly picture."
            />
          </Card>
        ) : (
          <>
            <Card className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                  This month
                </Text>
                <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">
                  {formatPercentage(data.savingsRate)} saving rate
                </Text>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Income</Text>
                  <Text className="mt-1 font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">
                    {formatCurrency(data.income)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Expense</Text>
                  <Text className="mt-1 font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">
                    {formatCurrency(data.expense)}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Income change</Text>
                  <Text className="mt-1 font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">
                    {formatPercentage(data.incomeChange, true)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl bg-card px-4 py-3 dark:bg-card-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Expense change</Text>
                  <Text className="mt-1 font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">
                    {formatPercentage(data.expenseChange, true)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                Key numbers
              </Text>
              <View className="flex-row items-start gap-3">
                <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
                <View className="flex-1 gap-1">
                  <Text className="tabular-nums text-sm text-ink dark:text-ink-dark">
                    Average daily spending is {formatCurrency(data.avgDailyExpense)}.
                  </Text>
                  <Text className="tabular-nums text-sm text-ink dark:text-ink-dark">
                    {data.transactionCount} transactions with {formatCurrency(data.monthlyRecurringExpense)} in monthly recurring costs.
                  </Text>
                  <Text className="tabular-nums text-sm text-ink dark:text-ink-dark">
                    Active goals are {formatPercentage(data.goalProgress)} complete across {data.activeGoals} goals.
                  </Text>
                  {data.topCategory ? (
                    <Text className="tabular-nums text-sm text-ink dark:text-ink-dark">
                      Largest category: {data.topCategory.name} ({formatCurrency(data.topCategory.total)}).
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
