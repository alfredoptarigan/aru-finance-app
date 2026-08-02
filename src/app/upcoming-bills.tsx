import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUpcomingBills, useUpcomingBillsSummary } from '@/features/upcoming-bills/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { UpcomingBill } from '@/types';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
const addMonths = (date: Date, amount: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
const monthStart = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const monthEnd = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

function monthCells(month: Date) {
  const start = monthStart(month);
  const end = monthEnd(month);
  const firstGridDate = new Date(start);
  firstGridDate.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const lastGridDate = new Date(end);
  lastGridDate.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
  const cellCount =
    Math.round((lastGridDate.getTime() - firstGridDate.getTime()) / 86_400_000) + 1;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = new Date(firstGridDate);
    day.setUTCDate(firstGridDate.getUTCDate() + index);
    return day;
  });
}

function groupByDate(bills: UpcomingBill[]) {
  return bills.reduce<Record<string, UpcomingBill[]>>((acc, bill) => {
    acc[bill.due_date] = [...(acc[bill.due_date] ?? []), bill];
    return acc;
  }, {});
}

function statusLabel(status: UpcomingBill['status']) {
  if (status === 'overdue') return 'Overdue';
  if (status === 'due_today') return 'Due today';
  return 'Upcoming';
}

function BillRow({ bill }: { bill: UpcomingBill }) {
  const colors = useThemeColors();
  const tone = bill.status === 'overdue' ? 'negative' : bill.status === 'due_today' ? 'positive' : 'neutral';

  return (
    <View className="flex-row items-center gap-3 border-b border-line py-3 dark:border-line-dark">
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${bill.color}20` }}
      >
        <Ionicons
          name={bill.icon as keyof typeof Ionicons.glyphMap}
          size={22}
          color={bill.color || colors.primary}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} className="flex-1 font-bold text-sm text-ink dark:text-ink-dark">
            {bill.name}
          </Text>
          <Text className="font-extrabold tabular-nums text-sm text-ink dark:text-ink-dark">
            {formatCurrency(bill.amount)}
          </Text>
        </View>
        <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
          <Text className="text-xs text-muted dark:text-muted-dark">
            {bill.category}
            {bill.payment_method ? ` • ${bill.payment_method}` : ''}
          </Text>
          <Badge label={bill.auto_debit ? 'Auto' : 'Manual'} tone="neutral" />
          <Badge label={statusLabel(bill.status)} tone={tone} />
        </View>
      </View>
    </View>
  );
}

export default function UpcomingBillsScreen({ showClose = true }: { showClose?: boolean }) {
  const colors = useThemeColors();
  const today = dateKey(new Date());
  const [activeMonth, setActiveMonth] = useState(() => monthStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const startDate = dateKey(monthStart(activeMonth));
  const endDate = dateKey(monthEnd(activeMonth));
  const bills = useUpcomingBills(startDate, endDate);
  const summary = useUpcomingBillsSummary(startDate, endDate);
  const items = useMemo(() => bills.data ?? [], [bills.data]);
  const billsByDate = useMemo(() => groupByDate(items), [items]);
  const selectedBills = billsByDate[selectedDate] ?? [];
  const selectedTotal = selectedBills.reduce((sum, bill) => sum + bill.amount, 0);
  const calendarCells = useMemo(() => monthCells(activeMonth), [activeMonth]);
  const calendarRows = useMemo(
    () => Array.from({ length: Math.ceil(calendarCells.length / 7) }, (_, i) => calendarCells.slice(i * 7, i * 7 + 7)),
    [calendarCells],
  );
  const isLoading = bills.isPending || summary.isPending;
  const monthLabel = formatDate(activeMonth, { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <ScreenHeader title="Bills calendar" subtitle="See what is due before it reaches your balance." back={showClose} />

        <View className="rounded-2xl bg-ink p-5 dark:bg-card-dark">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-sm text-white/75">Scheduled this month</Text>
              <Text className="mt-1 font-extrabold tabular-nums text-4xl text-white">
                {formatCurrency(summary.data?.total_amount ?? 0)}
              </Text>
              <Text className="mt-2 text-xs text-white/75">
                {summary.data?.nearest_due
                  ? `Next: ${summary.data.nearest_due.name}, ${formatDate(summary.data.nearest_due.due_date)}`
                  : 'No upcoming bill'}
              </Text>
            </View>
            <View className="rounded-xl bg-white/10 p-3">
              <Ionicons name="calendar-outline" size={26} color="#fff" />
            </View>
          </View>
          <View className="mt-5 flex-row gap-4 border-t border-white/15 pt-4">
            <View className="flex-1">
              <Text className="text-xs text-white/70">Bills</Text>
              <Text className="mt-1 font-bold text-lg text-white">{summary.data?.bill_count ?? 0}</Text>
            </View>
            <View className="flex-1 border-l border-white/15 pl-4">
              <Text className="text-xs text-white/70">Auto-debit</Text>
              <Text className="mt-1 font-bold tabular-nums text-lg text-white">
                {formatCurrency(summary.data?.auto_debit_total ?? 0)}
              </Text>
            </View>
            <View className="flex-1 border-l border-white/15 pl-4">
              <Text className="text-xs text-white/70">Overdue</Text>
              <Text className="mt-1 font-bold text-lg text-white">
                {summary.data?.overdue_count ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <Card className="gap-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setActiveMonth(addMonths(activeMonth, -1))}
              className="h-10 w-10 items-center justify-center rounded-full bg-line dark:bg-elevated-dark"
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </Pressable>
            <View className="items-center">
              <Text className="font-bold text-lg text-ink dark:text-ink-dark">{monthLabel}</Text>
              <Pressable
                onPress={() => {
                  setActiveMonth(monthStart(new Date()));
                  setSelectedDate(today);
                }}
              >
                <Text className="mt-1 font-semibold text-xs text-primary dark:text-primary-dark">
                  Today
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setActiveMonth(addMonths(activeMonth, 1))}
              className="h-10 w-10 items-center justify-center rounded-full bg-line dark:bg-elevated-dark"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View className="flex-row">
            {dayLabels.map((day) => (
              <Text
                key={day}
                className="flex-1 text-center font-semibold text-[11px] text-muted dark:text-muted-dark"
              >
                {day}
              </Text>
            ))}
          </View>

          {isLoading ? (
            <View className="gap-1.5">
              {Array.from({ length: 5 }, (_, row) => (
                <View key={row} className="flex-row gap-1.5">
                  {Array.from({ length: 7 }, (_, col) => (
                    <View key={col} className="flex-1">
                      <Skeleton className="h-12 rounded-2xl" />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-1.5">
              {calendarRows.map((week) => (
                <View key={dateKey(week[0])} className="flex-row gap-1.5">
                  {week.map((day) => {
                    const key = dateKey(day);
                    const dayBills = billsByDate[key] ?? [];
                    const inMonth = day.getUTCMonth() === activeMonth.getUTCMonth();
                    const selected = key === selectedDate;
                    const hasOverdue = dayBills.some((bill) => bill.status === 'overdue');
                    const isToday = key === today;

                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={`${formatDate(day, { month: 'long', day: 'numeric' })}, ${dayBills.length} bills`}
                        accessibilityState={{ selected }}
                        onPress={() => setSelectedDate(key)}
                        className={`h-12 flex-1 items-center justify-center rounded-2xl border ${
                          selected
                            ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                            : hasOverdue
                              ? 'border-error/50 bg-error/5 dark:border-error-dark/60 dark:bg-error-dark/10'
                              : isToday
                                ? 'border-accent/60 bg-accent/10 dark:border-accent-dark/70 dark:bg-accent-dark/15'
                                : 'border-line bg-bg dark:border-line-dark dark:bg-bg-dark'
                        }`}
                      >
                        <Text
                          className={`font-bold text-sm ${
                            selected
                              ? 'text-white'
                              : inMonth
                                ? 'text-ink dark:text-ink-dark'
                                : 'text-muted/40 dark:text-muted-dark/40'
                          }`}
                        >
                          {day.getUTCDate()}
                        </Text>
                        <View className="mt-1 h-2 flex-row items-center justify-center gap-0.5">
                          {dayBills.slice(0, 3).map((bill) => (
                            <View
                              key={bill.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: selected ? '#fff' : bill.color }}
                            />
                          ))}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </Card>

        {bills.isError || summary.isError ? (
          <Card>
            <EmptyState
              icon="cloud-offline-outline"
              title="Bills could not load"
              subtitle="Check your connection and try again."
            />
          </Card>
        ) : items.length === 0 && !isLoading ? (
          <Card>
            <EmptyState
              icon="calendar-clear-outline"
              title="No bills this month"
              subtitle="Add a subscription to place its next bill on the calendar."
            />
            <Pressable
              onPress={() => router.push('/subscription-form')}
              className="mx-4 mb-4 h-12 items-center justify-center rounded-2xl bg-primary active:opacity-80 dark:bg-primary-dark"
            >
              <Text className="font-bold text-white">Add subscription</Text>
            </Pressable>
          </Card>
        ) : (
          <View className="gap-3">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="font-bold text-base text-ink dark:text-ink-dark">
                  {formatDate(parseDate(selectedDate), {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">
                  {selectedBills.length} {selectedBills.length === 1 ? 'bill' : 'bills'} · {formatCurrency(selectedTotal)}
                </Text>
              </View>
              <Badge
                label={selectedDate === today ? 'Today' : selectedBills.length ? 'Bills due' : 'Empty'}
                tone={selectedDate === today || selectedBills.length ? 'positive' : 'neutral'}
              />
            </View>

            {selectedBills.length ? (
              selectedBills.map((bill) => <BillRow key={bill.id} bill={bill} />)
            ) : (
              <Card>
                <EmptyState
                  icon="moon-outline"
                  title="This date is clear"
                  subtitle="No bills are due on the selected date."
                />
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
