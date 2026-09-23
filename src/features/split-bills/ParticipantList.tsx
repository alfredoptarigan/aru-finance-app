import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { createId } from '@/lib/id';
import { useThemeColors } from '@/stores/theme';
import type { SplitBillParticipant } from '@/types';

export function ParticipantList({
  participants,
  onChange,
  disabled = false,
}: {
  participants: SplitBillParticipant[];
  onChange: (next: SplitBillParticipant[]) => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const [draftName, setDraftName] = useState('');

  const addParticipant = () => {
    const name = draftName.trim();
    if (!name) return;
    void Haptics.selectionAsync();
    onChange([...participants, { id: createId(), name, is_paid: false }]);
    setDraftName('');
  };

  const removeParticipant = (id: string) => {
    void Haptics.selectionAsync();
    onChange(participants.filter((p) => p.id !== id));
  };

  const renameParticipant = (id: string, name: string) => {
    onChange(participants.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  return (
    <View className="gap-2">
      <Text className="font-semibold text-base text-ink dark:text-ink-dark">Participants</Text>
      <View className="gap-2">
        {participants.map((participant) => (
          <Animated.View
            key={participant.id}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition.springify().damping(18)}
            className="min-h-14 flex-row items-center gap-3 rounded-xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-dark/15">
              <Text className="font-bold text-xs text-primary dark:text-primary-dark">
                {(participant.name.trim()[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <TextInput
              className="flex-1 font-medium text-sm text-ink dark:text-ink-dark"
              value={participant.name}
              editable={!disabled}
              maxLength={100}
              placeholder="Name"
              placeholderTextColor={colors.muted}
              onChangeText={(text) => renameParticipant(participant.id, text)}
            />
            {!disabled && participants.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${participant.name || 'participant'}`}
                hitSlop={8}
                onPress={() => removeParticipant(participant.id)}
              >
                <AppIcon name="close" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </Animated.View>
        ))}
      </View>

      {!disabled ? (
        <View className="flex-row items-center gap-2">
          <TextInput
            className="min-h-12 flex-1 rounded-xl border border-dashed border-line bg-transparent px-4 font-medium text-sm text-ink dark:border-line-dark dark:text-ink-dark"
            value={draftName}
            placeholder="Add participant"
            placeholderTextColor={colors.muted}
            onChangeText={setDraftName}
            onSubmitEditing={addParticipant}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add participant"
            onPress={addParticipant}
            disabled={!draftName.trim()}
            className={`h-12 w-12 items-center justify-center rounded-xl active:scale-95 ${
              draftName.trim() ? 'bg-primary dark:bg-primary-dark' : 'bg-line dark:bg-elevated-dark'
            }`}
          >
            <AppIcon name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
