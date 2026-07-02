import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/features/budgets/hooks';
import { useCategories } from '@/features/transactions/hooks';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return { month, year };
}

export default function BudgetForm() {
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const isEdit = !!params.id;
  const month = params.month ?? currentMonth();
  const colors = useThemeColors();
  const { month: monthNumber, year } = parseMonth(month);

  const [digits, setDigits] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  const categories = useCategories();
  const budgets = useBudgets(monthNumber, year);
  const create = useCreateBudget();
  const update = useUpdateBudget(params.id ?? '');
  const deleteBudget = useDeleteBudget();
  const mutation = isEdit ? update : create;

  useEffect(() => {
    const b = budgets.data?.find((x) => x.id === params.id);
    if (b) {
      setDigits(String(Math.round(b.limit_amount)));
      setCategoryId(b.category_id);
    }
  }, [budgets.data, params.id]);

  const expenseCategories = (categories.data ?? []).filter((c) => c.type === 'expense');

  const submit = () => {
    const amount = Number(digits || 0);
    if (amount <= 0) return setError('Nominal harus lebih dari 0');
    if (!categoryId) return setError('Pilih kategori dulu');
    setError('');
    mutation.mutate(
      { category_id: categoryId, limit_amount: amount, month: monthNumber, year },
      { onSuccess: () => router.back() },
    );
  };

  const confirmDelete = () =>
    Alert.alert('Hapus budget?', 'Budget kategori ini akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteBudget.mutate(params.id!, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="font-bold text-xl text-ink dark:text-ink-dark">
          {isEdit ? 'Edit Budget' : 'Tambah Budget'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <View className="items-center gap-1 py-2">
          <Text className="text-xs text-muted dark:text-muted-dark">Budget per bulan</Text>
          <TextInput
            className="font-extrabold text-5xl text-ink dark:text-ink-dark"
            keyboardType="number-pad"
            placeholder="Rp0"
            placeholderTextColor={colors.muted}
            value={digits ? formatCurrency(Number(digits)) : ''}
            onChangeText={(v) => setDigits(v.replace(/\D/g, ''))}
            maxLength={17}
          />
        </View>

        <View className="gap-2">
          <Text className="font-medium text-sm text-ink dark:text-ink-dark">Kategori</Text>
          <View className="flex-row flex-wrap gap-3">
            {expenseCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                className={`w-[22%] items-center gap-1.5 rounded-2xl border-2 py-3 ${
                  categoryId === c.id
                    ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10'
                    : 'border-transparent'
                }`}
              >
                <CategoryIcon category={c} size={40} />
                <Text
                  numberOfLines={1}
                  className="text-center text-[11px] text-muted dark:text-muted-dark"
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text className="text-sm text-error dark:text-error-dark">{error}</Text> : null}
        {mutation.error ? (
          <Text className="text-sm text-error dark:text-error-dark">{mutation.error.message}</Text>
        ) : null}

        <Button
          title={isEdit ? 'Simpan Perubahan' : 'Simpan Budget'}
          variant="gradient"
          loading={mutation.isPending}
          onPress={submit}
        />
        {isEdit && (
          <Button
            title="Hapus Budget"
            variant="ghost"
            loading={deleteBudget.isPending}
            onPress={confirmDelete}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
