import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { formatCurrency } from '@/lib/currency';
import { createId } from '@/lib/id';
import { useThemeColors } from '@/stores/theme';
import type { SplitBillItem, SplitBillParticipant } from '@/types';

function parseAmount(text: string): number {
  return Math.max(0, Math.round(Number(text.replace(/[^\d]/g, '')) || 0));
}

export function ItemList({
  items,
  participants,
  onChange,
  disabled = false,
}: {
  items: SplitBillItem[];
  participants: SplitBillParticipant[];
  onChange: (next: SplitBillItem[]) => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();

  const update = (id: string, patch: Partial<SplitBillItem>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const remove = (id: string) => {
    void Haptics.selectionAsync();
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    void Haptics.selectionAsync();
    onChange([
      ...items,
      { id: createId(), name: '', qty: 1, amount: 0, participant_ids: participants.map((p) => p.id) },
    ]);
  };

  const toggleParticipant = (item: SplitBillItem, participantId: string) => {
    void Haptics.selectionAsync();
    const has = item.participant_ids.includes(participantId);
    update(item.id, {
      participant_ids: has
        ? item.participant_ids.filter((id) => id !== participantId)
        : [...item.participant_ids, participantId],
    });
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-base text-ink dark:text-ink-dark">Items</Text>
        {!disabled ? (
          <Pressable accessibilityRole="button" onPress={addItem} className="min-h-11 justify-center px-1">
            <Text className="font-semibold text-xs text-primary dark:text-primary-dark">Add item</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-3">
        {items.map((item) => {
          const unassigned = item.participant_ids.length === 0;
          return (
            <Animated.View
              key={item.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              layout={LinearTransition.springify().damping(18)}
              className={`gap-3 rounded-xl border p-3 dark:bg-card-dark ${
                unassigned ? 'border-accent/60 bg-accent/5 dark:border-accent-dark/50' : 'border-line bg-card dark:border-line-dark'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 font-medium text-sm text-ink dark:text-ink-dark"
                  value={item.name}
                  editable={!disabled}
                  placeholder="Item name"
                  placeholderTextColor={colors.muted}
                  onChangeText={(text) => update(item.id, { name: text })}
                />
                {!disabled ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.name || 'item'}`} hitSlop={8} onPress={() => remove(item.id)}>
                    <AppIcon name="close" size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>

              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-xs text-muted dark:text-muted-dark">Qty</Text>
                  <TextInput
                    className="min-w-10 rounded-lg border border-line px-2 py-1.5 text-center font-medium text-sm text-ink dark:border-line-dark dark:text-ink-dark"
                    value={String(item.qty)}
                    editable={!disabled}
                    keyboardType="number-pad"
                    onChangeText={(text) => update(item.id, { qty: Math.max(1, parseAmount(text) || 1) })}
                  />
                </View>
                <View className="flex-1 flex-row items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 dark:border-line-dark">
                  <Text className="text-xs text-muted dark:text-muted-dark">Rp</Text>
                  <TextInput
                    className="flex-1 tabular-nums font-semibold text-sm text-ink dark:text-ink-dark"
                    value={item.amount ? String(item.amount) : ''}
                    editable={!disabled}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    onChangeText={(text) => update(item.id, { amount: parseAmount(text) })}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                {unassigned ? <Text className="text-xs text-accent dark:text-accent-dark">Assign at least one participant</Text> : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
                  {participants.map((participant) => {
                    const active = item.participant_ids.includes(participant.id);
                    return (
                      <Pressable
                        key={participant.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${active ? 'Remove' : 'Assign'} ${participant.name || 'participant'} for ${item.name || 'item'}`}
                        disabled={disabled}
                        onPress={() => toggleParticipant(item, participant.id)}
                        className={`min-h-9 flex-row items-center rounded-full border px-3 active:scale-95 ${
                          active
                            ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                            : 'border-line bg-transparent dark:border-line-dark'
                        }`}
                      >
                        <Text className={`font-medium text-xs ${active ? 'text-white' : 'text-muted dark:text-muted-dark'}`}>
                          {participant.name || 'Unnamed'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {item.participant_ids.length > 0 ? (
                <Text className="text-xs text-muted dark:text-muted-dark">
                  {formatCurrency(Math.floor(item.amount / item.participant_ids.length))} each × {item.participant_ids.length}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
