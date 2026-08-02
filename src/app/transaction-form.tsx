import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { z } from 'zod';

import { CategoryIcon } from '@/components/CategoryIcon';
import { WalletPicker } from '@/components/WalletPicker';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useCategories,
  useCreateTransaction,
  useTransaction,
  useUpdateTransaction,
} from '@/features/transactions/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { TransactionType } from '@/types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Choose a category'),
  transaction_date: z.string(),
  payment_method_id: z.string().min(1, 'Choose a wallet'),
});

export default function TransactionForm() {
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const isEdit = !!params.id;
  const colors = useThemeColors();

  const [type, setType] = useState<TransactionType>(
    params.type === 'income' ? 'income' : 'expense',
  );
  const [digits, setDigits] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const categories = useCategories();
  const existing = useTransaction(params.id ?? '');
  const create = useCreateTransaction();
  const update = useUpdateTransaction(params.id ?? '');
  const mutation = isEdit ? update : create;

  useEffect(() => {
    const t = existing.data;
    if (!t) return;
    // Query data arrives after the modal mounts; hydrate the editable draft once available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(t.type);
    setDigits(String(Math.round(t.amount)));
    setTitle(t.title);
    setDescription(t.description ?? '');
    setCategoryId(t.category_id);
    setDate(new Date(t.transaction_date));
    setPaymentMethodId(t.payment_method_id ?? null);
  }, [existing.data]);

  const typeCategories = (categories.data ?? []).filter((c) => c.type === type);

  const submit = () => {
    const parsed = schema.safeParse({
      type,
      amount: Number(digits || 0),
      title: title.trim(),
      description: description.trim() || undefined,
      category_id: categoryId,
      transaction_date: date.toISOString().slice(0, 10),
      payment_method_id: paymentMethodId,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        map[String(i.path[0])] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
        setTimeout(() => router.back(), 900);
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">
            {isEdit ? 'Edit transaction' : 'New transaction'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View className="flex-row rounded-2xl bg-line/60 p-1 dark:bg-elevated-dark">
            {(['expense', 'income'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => {
                  setType(t);
                  setCategoryId('');
                }}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  type === t
                    ? t === 'income'
                      ? 'bg-secondary dark:bg-secondary-dark'
                      : 'bg-error dark:bg-error-dark'
                    : ''
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    type === t ? 'text-white' : 'text-muted dark:text-muted-dark'
                  }`}
                >
                  {t === 'income' ? 'Income' : 'Expense'}
                </Text>
              </Pressable>
            ))}
          </View>

          {!isEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan a receipt"
              onPress={() => router.push('/receipt-scanner')}
              className="min-h-16 flex-row items-center gap-3 rounded-xl bg-ink px-4 active:scale-[0.98] dark:bg-card-dark"
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <AppIcon name="scan" size={21} color="#fff" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-semibold text-sm text-white">Scan a receipt</Text>
                <Text className="text-xs text-white/65">Extract line items from a photo or PDF.</Text>
              </View>
              <AppIcon name="chevronRight" size={18} color="#fff" />
            </Pressable>
          ) : null}

          {/* Amount */}
          <View className="items-center gap-1 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Amount</Text>
            <TextInput
              className="font-extrabold tabular-nums text-5xl text-ink dark:text-ink-dark"
              keyboardType="number-pad"
              placeholder="Rp0"
              placeholderTextColor={colors.muted}
              value={digits ? formatCurrency(Number(digits)) : ''}
              onChangeText={(v) => setDigits(v.replace(/\D/g, ''))}
              maxLength={17}
            />
            {errors.amount ? (
              <Text className="text-xs text-error dark:text-error-dark">{errors.amount}</Text>
            ) : null}
          </View>

          <Input
            label="Title"
            icon="create-outline"
            placeholder="For example, lunch"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
          <Input
            label="Description (optional)"
            icon="document-text-outline"
            placeholder="Add a note"
            value={description}
            onChangeText={setDescription}
          />

          {/* Category grid */}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Category</Text>
            {errors.category_id ? (
              <Text className="text-xs text-error dark:text-error-dark">{errors.category_id}</Text>
            ) : null}
            <View className="flex-row flex-wrap gap-3">
              {typeCategories.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: categoryId === c.id }}
                  className={`min-h-16 w-[22%] items-center gap-1.5 rounded-xl border-2 py-3 ${
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
              {typeCategories.length === 0 && (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  No categories are available for this type.
                </Text>
              )}
            </View>
          </View>

          {/* Date */}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Date</Text>
            <Pressable
              onPress={() => setShowDate(true)}
              className="h-14 flex-row items-center gap-2.5 rounded-xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark"
            >
              <Ionicons name="calendar-outline" size={20} color={colors.muted} />
              <Text className="text-base text-ink dark:text-ink-dark">{formatDate(date)}</Text>
            </Pressable>
            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(_e, d) => {
                  setShowDate(Platform.OS === 'ios');
                  if (d) setDate(d);
                }}
              />
            )}
          </View>

          <WalletPicker
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            error={errors.payment_method_id}
            helper={type === 'expense' ? 'This wallet will be debited.' : 'This wallet will receive the income.'}
          />

          {mutation.error ? (
            <Text className="text-sm text-error dark:text-error-dark">
              {mutation.error.message}
            </Text>
          ) : null}

          <Button
            title={isEdit ? 'Save changes' : 'Save transaction'}
            loading={mutation.isPending}
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      {done && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <Animated.View
            entering={ZoomIn.duration(260).reduceMotion(ReduceMotion.System)}
            className="h-24 w-24 items-center justify-center rounded-2xl bg-secondary dark:bg-secondary-dark"
          >
            <Ionicons name="checkmark" size={52} color="#fff" />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
