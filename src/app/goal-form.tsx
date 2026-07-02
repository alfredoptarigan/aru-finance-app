import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from '@/features/goals/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

function AmountField({
  label,
  digits,
  onChange,
}: {
  label: string;
  digits: string;
  onChange: (v: string) => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="gap-1.5">
      <Text className="font-medium text-sm text-ink dark:text-ink-dark">{label}</Text>
      <TextInput
        className="h-14 rounded-2xl border border-line bg-card px-4 font-semibold text-lg text-ink dark:border-line-dark dark:bg-card-dark dark:text-ink-dark"
        keyboardType="number-pad"
        placeholder="Rp0"
        placeholderTextColor={colors.muted}
        value={digits ? formatCurrency(Number(digits)) : ''}
        onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
        maxLength={17}
      />
    </View>
  );
}

export default function GoalForm() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const colors = useThemeColors();

  const [title, setTitle] = useState('');
  const [targetDigits, setTargetDigits] = useState('');
  const [currentDigits, setCurrentDigits] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState('');

  const goals = useGoals();
  const create = useCreateGoal();
  const update = useUpdateGoal(params.id ?? '');
  const deleteGoal = useDeleteGoal();
  const mutation = isEdit ? update : create;

  useEffect(() => {
    const g = goals.data?.find((x) => x.id === params.id);
    if (g) {
      setTitle(g.title);
      setTargetDigits(String(Math.round(g.target_amount)));
      setCurrentDigits(String(Math.round(g.current_amount)));
      setDeadline(g.deadline ? new Date(g.deadline) : null);
    }
  }, [goals.data, params.id]);

  const submit = () => {
    if (!title.trim()) return setError('Nama target wajib diisi');
    const target = Number(targetDigits || 0);
    if (target <= 0) return setError('Target harus lebih dari 0');
    setError('');
    mutation.mutate(
      {
        title: title.trim(),
        target_amount: target,
        current_amount: Number(currentDigits || 0),
        deadline: deadline ? deadline.toISOString().slice(0, 10) : undefined,
      },
      { onSuccess: () => router.back() },
    );
  };

  const confirmDelete = () =>
    Alert.alert('Hapus target?', 'Target tabungan ini akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteGoal.mutate(params.id!, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="font-bold text-xl text-ink dark:text-ink-dark">
          {isEdit ? 'Edit Target' : 'Target Baru'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <Input
          label="Nama Target"
          icon="flag-outline"
          placeholder="Contoh: Dana darurat"
          value={title}
          onChangeText={setTitle}
        />
        <AmountField label="Target Nominal" digits={targetDigits} onChange={setTargetDigits} />
        <AmountField
          label="Terkumpul Saat Ini"
          digits={currentDigits}
          onChange={setCurrentDigits}
        />

        <View className="gap-1.5">
          <Text className="font-medium text-sm text-ink dark:text-ink-dark">
            Deadline (opsional)
          </Text>
          <Pressable
            onPress={() => setShowDate(true)}
            className="h-14 flex-row items-center gap-2.5 rounded-2xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark"
          >
            <Ionicons name="calendar-outline" size={20} color={colors.muted} />
            <Text className="text-base text-ink dark:text-ink-dark">
              {deadline ? formatDate(deadline) : 'Pilih tanggal'}
            </Text>
          </Pressable>
          {showDate && (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_e, d) => {
                setShowDate(Platform.OS === 'ios');
                if (d) setDeadline(d);
              }}
            />
          )}
        </View>

        {error ? <Text className="text-sm text-error dark:text-error-dark">{error}</Text> : null}
        {mutation.error ? (
          <Text className="text-sm text-error dark:text-error-dark">{mutation.error.message}</Text>
        ) : null}

        <Button
          title={isEdit ? 'Simpan Perubahan' : 'Simpan Target'}
          variant="gradient"
          loading={mutation.isPending}
          onPress={submit}
        />
        {isEdit && (
          <Button
            title="Hapus Target"
            variant="ghost"
            loading={deleteGoal.isPending}
            onPress={confirmDelete}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
