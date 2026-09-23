import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { formatCurrency } from '@/lib/currency';
import type { SplitBillBreakdown } from '@/types';

export function BreakdownCard({ breakdown, receiptTotal }: { breakdown: SplitBillBreakdown; receiptTotal: number }) {
  const diff = receiptTotal - breakdown.grand_total;
  const matches = diff === 0;

  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} className="gap-3 rounded-2xl bg-ink p-5 dark:bg-card-dark">
      <Text className="text-sm text-white/65">Split total</Text>
      <Animated.Text
        key={breakdown.grand_total}
        entering={FadeIn.duration(180)}
        className="font-extrabold tabular-nums text-4xl text-white"
      >
        {formatCurrency(breakdown.grand_total)}
      </Animated.Text>

      <View
        className={`flex-row items-center gap-2 rounded-lg px-3 py-2 ${
          matches ? 'bg-secondary/25' : 'bg-accent/25'
        }`}
      >
        <AppIcon name={matches ? 'success' : 'error'} size={16} color={matches ? '#7DE0A8' : '#FFC178'} />
        <Text className="flex-1 text-xs text-white/85">
          {matches
            ? 'Matches receipt total'
            : `${diff > 0 ? formatCurrency(diff) + ' short of' : formatCurrency(Math.abs(diff)) + ' over'} receipt total`}
        </Text>
      </View>

      <View className="gap-2 border-t border-white/15 pt-4">
        {breakdown.participants.map((participant) => (
          <Animated.View
            key={participant.participant_id}
            layout={LinearTransition.springify().damping(18)}
            className="flex-row items-center justify-between gap-3"
          >
            <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-white/85">
              {participant.name || 'Unnamed'}
            </Text>
            <Text className="shrink-0 tabular-nums font-semibold text-sm text-white">
              {formatCurrency(participant.total)}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}
