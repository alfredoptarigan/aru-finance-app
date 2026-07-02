import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
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
import { z } from 'zod';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useCategories,
  useCreateTransaction,
  usePaymentMethods,
  useTransaction,
  useUpdateTransaction,
} from '@/features/transactions/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { TransactionType } from '@/types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  title: z.string().min(1, 'Judul wajib diisi'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Pilih kategori dulu'),
  transaction_date: z.string(),
  payment_method_id: z.string().nullable().optional(),
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
  const paymentMethods = usePaymentMethods();
  const existing = useTransaction(params.id ?? '');
  const create = useCreateTransaction();
  const update = useUpdateTransaction(params.id ?? '');
  const mutation = isEdit ? update : create;

  useEffect(() => {
    const t = existing.data;
    if (!t) return;
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
    <SafeAreaView edges={['bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
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
                  {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <View className="items-center gap-1 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Nominal</Text>
            <TextInput
              className="font-extrabold text-5xl text-ink dark:text-ink-dark"
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
            label="Judul"
            icon="create-outline"
            placeholder="Contoh: Makan siang"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
          <Input
            label="Deskripsi (opsional)"
            icon="document-text-outline"
            placeholder="Catatan tambahan"
            value={description}
            onChangeText={setDescription}
          />

          {/* Category grid */}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Kategori</Text>
            {errors.category_id ? (
              <Text className="text-xs text-error dark:text-error-dark">{errors.category_id}</Text>
            ) : null}
            <View className="flex-row flex-wrap gap-3">
              {typeCategories.map((c) => (
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
              {typeCategories.length === 0 && (
                <Text className="text-sm text-muted dark:text-muted-dark">
                  Belum ada kategori untuk tipe ini.
                </Text>
              )}
            </View>
          </View>

          {/* Date */}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Tanggal</Text>
            <Pressable
              onPress={() => setShowDate(true)}
              className="h-14 flex-row items-center gap-2.5 rounded-2xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark"
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

          {/* Payment method */}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">
              Metode Pembayaran
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(paymentMethods.data ?? []).map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setPaymentMethodId(paymentMethodId === m.id ? null : m.id)}
                  className={`rounded-full border px-3.5 py-2 ${
                    paymentMethodId === m.id
                      ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                      : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                  }`}
                >
                  <Text
                    className={`font-medium text-xs ${
                      paymentMethodId === m.id ? 'text-white' : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    {m.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {mutation.error ? (
            <Text className="text-sm text-error dark:text-error-dark">
              {mutation.error.message}
            </Text>
          ) : null}

          <Button
            title={isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            variant="gradient"
            loading={mutation.isPending}
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      {done && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <MotiView
            from={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="h-24 w-24 items-center justify-center rounded-full bg-secondary dark:bg-secondary-dark"
          >
            <Ionicons name="checkmark" size={52} color="#fff" />
          </MotiView>
        </View>
      )}
    </SafeAreaView>
  );
}
