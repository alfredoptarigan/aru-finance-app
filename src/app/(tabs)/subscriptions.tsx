import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteSubscription, useSubscriptions, useUpdateSubscription } from '@/features/subscriptions/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { Subscription } from '@/types';

const cycleLabel = { weekly: 'weekly', monthly: 'monthly', yearly: 'yearly' } as const;

function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function monthlyAmount(sub: Subscription) {
  if (sub.billing_cycle === 'weekly') return sub.amount * 4;
  if (sub.billing_cycle === 'yearly') return sub.amount / 12;
  return sub.amount;
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  void delay;
  return <View>{children}</View>;
}

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const colors = useThemeColors();
  const update = useUpdateSubscription(sub.id);
  const deleteSubscription = useDeleteSubscription();
  const due = daysUntil(sub.next_billing_date);
  const busy = update.isPending || deleteSubscription.isPending;

  const confirmDelete = () =>
    Alert.alert('Delete subscription?', `"${sub.name}" will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSubscription.mutate(sub.id),
      },
    ]);

  return (
    <View className="gap-4 border-b border-line py-5 dark:border-line-dark">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${sub.color}18` }}
          >
            <Ionicons
              name={sub.icon as keyof typeof Ionicons.glyphMap}
              size={26}
              color={sub.color}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 font-bold text-base text-ink dark:text-ink-dark"
              >
                {sub.name}
              </Text>
              <View className="rounded-md bg-line px-2.5 py-1 dark:bg-elevated-dark">
                <Text className="font-semibold text-[11px] text-muted dark:text-muted-dark">
                  {due < 0 ? 'Overdue' : `Due in ${due}d`}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark">
              {sub.description ?? sub.category}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: sub.is_active, disabled: busy }}
          disabled={busy}
          onPress={() => update.mutate({ is_active: !sub.is_active })}
          className={`h-7 w-12 justify-center rounded-full px-1 ${
            sub.is_active
              ? 'items-end bg-secondary dark:bg-secondary-dark'
              : 'items-start bg-line dark:bg-line-dark'
          }`}
        >
          <View className="h-5 w-5 rounded-full bg-white" />
        </Pressable>
      </View>

      <View>
        <Text className="font-extrabold tabular-nums text-2xl text-ink dark:text-ink-dark">
          {formatCurrency(sub.amount)}
          <Text className="font-medium text-sm text-muted dark:text-muted-dark">
            {' '}
            / {cycleLabel[sub.billing_cycle]}
          </Text>
        </Text>
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={15} color={colors.muted} />
          <Text className="text-xs text-muted dark:text-muted-dark">
            Next: {formatDate(sub.next_billing_date)}
          </Text>
        </View>
        {sub.auto_debit ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="flash-outline" size={15} color={colors.accent} />
            <Text className="font-medium text-xs text-accent dark:text-accent-dark">
              Auto-debit{sub.payment_method ? ` from ${sub.payment_method}` : ''}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => router.push(`/subscription-form?id=${sub.id}`)}
          className="rounded-xl bg-primary/10 px-3.5 py-2 active:opacity-70 dark:bg-primary-dark/15"
        >
          <Text className="font-semibold text-xs text-primary dark:text-primary-dark">Edit</Text>
        </Pressable>
        <Pressable
          disabled={deleteSubscription.isPending}
          onPress={confirmDelete}
          className="rounded-xl bg-error/10 px-3.5 py-2 active:opacity-70 dark:bg-error-dark/15"
        >
          <Text className="font-semibold text-xs text-error dark:text-error-dark">Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Subscriptions() {
  const subscriptions = useSubscriptions();
  const items = subscriptions.data ?? [];
  const active = items.filter((s) => s.is_active);
  const monthlyTotal = active.reduce((sum, sub) => sum + monthlyAmount(sub), 0);
  const nearestDue = active.reduce<number | null>((nearest, sub) => {
    const due = daysUntil(sub.next_billing_date);
    return nearest === null || due < nearest ? due : nearest;
  }, null);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-28 pt-2">
        <Section>
          <ScreenHeader
            title="Subscriptions"
            subtitle="Recurring payments and their next billing dates."
            action={{ icon: 'calendar', label: 'Open bills calendar', onPress: () => router.push('/upcoming-bills') }}
          />
        </Section>

        <Section delay={70}>
          <View className="rounded-2xl bg-ink p-5 dark:bg-card-dark">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-sm text-white/75">Monthly burn</Text>
                <Text className="mt-1 font-extrabold tabular-nums text-4xl text-white">
                  {formatCurrency(monthlyTotal)}
                </Text>
              </View>
              <View className="rounded-xl bg-white/10 p-3">
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </View>
            </View>
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1 border-t border-white/20 pt-3">
                <Text className="text-xs text-white/75">Active</Text>
                <Text className="mt-1 font-bold text-lg text-white">{active.length} services</Text>
              </View>
              <View className="flex-1 border-t border-white/20 pt-3">
                <Text className="text-xs text-white/75">Nearest due</Text>
                <Text className="mt-1 font-bold text-lg text-white">
                  {nearestDue === null ? '-' : `${nearestDue} days`}
                </Text>
              </View>
            </View>
          </View>
        </Section>

        <Section delay={140}>
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-base text-ink dark:text-ink-dark">
              Upcoming bills
            </Text>
            <Text className="font-medium text-xs text-muted dark:text-muted-dark">
              {items.length} total
            </Text>
          </View>
        </Section>

        {subscriptions.isError ? (
          <Card>
            <EmptyState
              icon="cloud-offline-outline"
              title="Subscriptions could not load"
              subtitle="Pull to retry or check your connection."
            />
          </Card>
        ) : subscriptions.isPending ? (
          <View className="gap-2.5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-3xl" />
            ))}
          </View>
        ) : items.length === 0 ? (
          <Section delay={180}>
            <Card>
              <EmptyState
                icon="repeat-outline"
                title="No subscriptions yet"
                subtitle="Add a recurring service so its next bill stays visible."
              />
            </Card>
          </Section>
        ) : (
          items.map((sub, index) => (
            <Section key={sub.id} delay={180 + index * 60}>
              <SubscriptionCard sub={sub} />
            </Section>
          ))
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add subscription"
        onPress={() => router.push('/subscription-form')}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary active:scale-95 dark:bg-primary-dark"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}
