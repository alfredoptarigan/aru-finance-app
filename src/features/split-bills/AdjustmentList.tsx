import * as Haptics from 'expo-haptics';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { createId } from '@/lib/id';
import { useThemeColors } from '@/stores/theme';
import type { SplitBillAdjustment, SplitBillAdjustmentKind } from '@/types';

function parseAmount(text: string): number {
  return Math.max(0, Math.round(Number(text.replace(/[^\d]/g, '')) || 0));
}

const KIND_LABEL: Record<SplitBillAdjustmentKind, string> = { discount: 'Discount', fee: 'Fee' };

export function AdjustmentList({
  adjustments,
  onChange,
  disabled = false,
}: {
  adjustments: SplitBillAdjustment[];
  onChange: (next: SplitBillAdjustment[]) => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();

  const update = (id: string, patch: Partial<SplitBillAdjustment>) =>
    onChange(adjustments.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const remove = (id: string) => {
    void Haptics.selectionAsync();
    onChange(adjustments.filter((a) => a.id !== id));
  };

  const addAdjustment = (kind: SplitBillAdjustmentKind) => {
    void Haptics.selectionAsync();
    onChange([...adjustments, { id: createId(), name: '', kind, amount: 0 }]);
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-base text-ink dark:text-ink-dark">Discounts &amp; fees</Text>
        {!disabled ? (
          <View className="flex-row gap-3">
            <Pressable accessibilityRole="button" onPress={() => addAdjustment('discount')} className="min-h-11 justify-center px-1">
              <Text className="font-semibold text-xs text-secondary dark:text-secondary-dark">+ Discount</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => addAdjustment('fee')} className="min-h-11 justify-center px-1">
              <Text className="font-semibold text-xs text-primary dark:text-primary-dark">+ Fee</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {adjustments.length === 0 ? (
        <Text className="text-xs text-muted dark:text-muted-dark">No discounts or fees on this bill.</Text>
      ) : (
        <View className="gap-2">
          {adjustments.map((adjustment) => (
            <Animated.View
              key={adjustment.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.springify().damping(18)}
              className="min-h-12 flex-row items-center gap-2 rounded-xl border border-line bg-card px-3 dark:border-line-dark dark:bg-card-dark"
            >
              <View
                className={`rounded-md px-2 py-1 ${
                  adjustment.kind === 'discount' ? 'bg-secondary/15 dark:bg-secondary-dark/20' : 'bg-primary/10 dark:bg-primary-dark/15'
                }`}
              >
                <Text
                  className={`font-semibold text-[10px] uppercase tracking-wide ${
                    adjustment.kind === 'discount' ? 'text-secondary dark:text-secondary-dark' : 'text-primary dark:text-primary-dark'
                  }`}
                >
                  {KIND_LABEL[adjustment.kind]}
                </Text>
              </View>
              <TextInput
                className="flex-1 font-medium text-sm text-ink dark:text-ink-dark"
                value={adjustment.name}
                editable={!disabled}
                placeholder={`${KIND_LABEL[adjustment.kind]} name`}
                placeholderTextColor={colors.muted}
                onChangeText={(text) => update(adjustment.id, { name: text })}
              />
              <TextInput
                className="w-24 tabular-nums text-right font-semibold text-sm text-ink dark:text-ink-dark"
                value={adjustment.amount ? String(adjustment.amount) : ''}
                editable={!disabled}
                placeholder="0"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                onChangeText={(text) => update(adjustment.id, { amount: parseAmount(text) })}
              />
              {!disabled ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${adjustment.name || KIND_LABEL[adjustment.kind]}`} hitSlop={8} onPress={() => remove(adjustment.id)}>
                  <AppIcon name="close" size={16} color={colors.muted} />
                </Pressable>
              ) : null}
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
}
