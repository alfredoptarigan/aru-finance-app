import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { gradients } from '@/constants/colors';
import { useSubscriptions } from '@/features/subscriptions/hooks';
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
  const due = daysUntil(sub.next_billing_date);

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row gap-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-3xl"
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
              <View className="rounded-full bg-line px-2.5 py-1 dark:bg-elevated-dark">
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
        <View
          className={`h-7 w-12 justify-center rounded-full px-1 ${
            sub.is_active
              ? 'items-end bg-secondary dark:bg-secondary-dark'
              : 'items-start bg-line dark:bg-line-dark'
          }`}
        >
          <View className="h-5 w-5 rounded-full bg-white" />
        </View>
      </View>

      <View>
        <Text className="font-extrabold text-2xl text-ink dark:text-ink-dark">
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
        <Pressable className="rounded-xl bg-primary/10 px-3.5 py-2 active:opacity-70 dark:bg-primary-dark/15">
          <Text className="font-semibold text-xs text-primary dark:text-primary-dark">Edit</Text>
        </Pressable>
        <Pressable className="rounded-xl bg-error/10 px-3.5 py-2 active:opacity-70 dark:bg-error-dark/15">
          <Text className="font-semibold text-xs text-error dark:text-error-dark">Delete</Text>
        </Pressable>
      </View>
    </Card>
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
          <View>
            <Text className="text-sm text-muted dark:text-muted-dark">Recurring payments</Text>
            <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Subscription</Text>
          </View>
        </Section>

        <Section delay={70}>
          <LinearGradient
            colors={gradients.saving}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, padding: 22 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-sm text-white/75">Monthly burn</Text>
                <Text className="mt-1 font-extrabold text-4xl text-white">
                  {formatCurrency(monthlyTotal)}
                </Text>
              </View>
              <View className="rounded-2xl bg-white/15 p-3">
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </View>
            </View>
            <View className="mt-5 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/15 p-3">
                <Text className="text-xs text-white/75">Active</Text>
                <Text className="mt-1 font-bold text-lg text-white">{active.length} services</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white/15 p-3">
                <Text className="text-xs text-white/75">Nearest due</Text>
                <Text className="mt-1 font-bold text-lg text-white">
                  {nearestDue === null ? '-' : `${nearestDue} days`}
                </Text>
              </View>
            </View>
          </LinearGradient>
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
              title="Subscription gagal dimuat"
              subtitle="Tarik untuk mencoba lagi atau cek koneksi server."
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
                title="Belum ada subscription"
                subtitle="Tambah layanan yang berulang supaya tagihan tidak kelewat."
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
        onPress={() => router.push('/subscription-form')}
        className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full active:opacity-80"
        style={{
          shadowColor: '#6366F1',
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 64,
            width: 64,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 32,
          }}
        >
          <Ionicons name="add" size={34} color="#fff" />
        </LinearGradient>
      </Pressable>
    </SafeAreaView>
  );
}
