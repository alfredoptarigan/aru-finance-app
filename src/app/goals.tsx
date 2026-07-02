import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGoals } from '@/features/goals/hooks';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { Goal } from '@/types';

function ProgressRing({ progress, size = 64 }: { progress: number; size?: number }) {
  const colors = useThemeColors();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={clamped >= 1 ? colors.secondary : colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </Svg>
      <Text className="absolute font-bold text-xs text-ink dark:text-ink-dark">
        {formatPercentage(clamped * 100)}
      </Text>
    </View>
  );
}

function monthlySuggestion(goal: Goal): string | null {
  if (!goal.deadline) return null;
  const remaining = goal.target_amount - goal.current_amount;
  if (remaining <= 0) return null;
  const monthsLeft = Math.max(
    Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (30 * 86400_000)),
    1,
  );
  return `Nabung ${formatCurrency(Math.ceil(remaining / monthsLeft))}/bulan untuk mencapai target`;
}

export default function Goals() {
  const colors = useThemeColors();
  const goals = useGoals();
  const items = goals.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">Target Tabungan</Text>
        </View>
        <Pressable
          onPress={() => router.push('/goal-form')}
          className="h-10 w-10 items-center justify-center rounded-2xl bg-primary dark:bg-primary-dark active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-3.5 px-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={goals.isRefetching}
            onRefresh={() => void goals.refetch()}
            tintColor={colors.muted}
          />
        }
      >
        {goals.isPending ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState
              icon="flag-outline"
              title="Belum ada target"
              subtitle="Buat target tabungan pertamamu — mulai dari yang kecil juga oke!"
            />
          </Card>
        ) : (
          items.map((g) => {
            const progress = g.target_amount > 0 ? g.current_amount / g.target_amount : 0;
            const done = progress >= 1;
            const suggestion = monthlySuggestion(g);
            return (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/goal-form?id=${g.id}`)}
                className="active:opacity-80"
              >
                <Card className="flex-row items-center gap-4">
                  <ProgressRing progress={progress} />
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="font-semibold text-base text-ink dark:text-ink-dark">
                        {g.title}
                      </Text>
                      {done && (
                        <MotiView
                          from={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 8 }}
                        >
                          <Text className="text-base">🎉</Text>
                        </MotiView>
                      )}
                    </View>
                    <Text className="text-xs text-muted dark:text-muted-dark">
                      {formatCurrency(g.current_amount)} dari {formatCurrency(g.target_amount)}
                      {g.deadline ? ` · ${formatDate(g.deadline)}` : ''}
                    </Text>
                    <Text className="text-xs text-primary dark:text-primary-dark">
                      {done ? 'Target tercapai — keren banget! 🚀' : suggestion ?? 'Terus konsisten ya! 💪'}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
