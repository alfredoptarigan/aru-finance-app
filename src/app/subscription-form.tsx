import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
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

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateSubscription } from '@/features/subscriptions/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { SubscriptionBillingCycle } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Nama layanan wajib diisi'),
  description: z.string().optional(),
  amount: z.number().positive('Nominal harus lebih dari 0'),
  billing_cycle: z.enum(['weekly', 'monthly', 'yearly']),
  next_billing_date: z.string(),
  category: z.string().min(1, 'Kategori wajib diisi'),
  payment_method: z.string().nullable().optional(),
  auto_debit: z.boolean(),
  is_active: z.boolean(),
});

const cycles: { value: SubscriptionBillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const categories = ['Entertainment', 'Work tools', 'Insurance', 'Cloud', 'Other'];

export default function SubscriptionForm() {
  const colors = useThemeColors();
  const create = useCreateSubscription();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [digits, setDigits] = useState('');
  const [cycle, setCycle] = useState<SubscriptionBillingCycle>('monthly');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [category, setCategory] = useState('Entertainment');
  const [paymentMethod, setPaymentMethod] = useState('Rekening gaji');
  const [autoDebit, setAutoDebit] = useState(true);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed = schema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
      amount: Number(digits || 0),
      billing_cycle: cycle,
      next_billing_date: date.toISOString().slice(0, 10),
      category,
      payment_method: paymentMethod.trim() || null,
      auto_debit: autoDebit,
      is_active: active,
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        map[String(issue.path[0])] = issue.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
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
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">Tambah Subscription</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-1 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Biaya</Text>
            <TextInput
              className="font-extrabold text-5xl text-ink dark:text-ink-dark"
              keyboardType="number-pad"
              placeholder="Rp0"
              placeholderTextColor={colors.muted}
              value={digits ? formatCurrency(Number(digits)) : ''}
              onChangeText={(value) => setDigits(value.replace(/\D/g, ''))}
              maxLength={17}
            />
            {errors.amount ? (
              <Text className="text-xs text-error dark:text-error-dark">{errors.amount}</Text>
            ) : null}
          </View>

          <Input
            label="Nama layanan"
            icon="repeat-outline"
            placeholder="Contoh: Netflix"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Input
            label="Catatan"
            icon="document-text-outline"
            placeholder="Contoh: Family plan"
            value={description}
            onChangeText={setDescription}
          />
          <Input
            label="Metode pembayaran"
            icon="card-outline"
            placeholder="Contoh: Rekening gaji"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />

          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Billing cycle</Text>
            <View className="flex-row gap-2">
              {cycles.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setCycle(item.value)}
                  className={`flex-1 rounded-2xl border py-3 ${
                    cycle === item.value
                      ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                      : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                  }`}
                >
                  <Text
                    className={`text-center font-semibold text-sm ${
                      cycle === item.value ? 'text-white' : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Kategori</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  className={`rounded-full border px-3.5 py-2 ${
                    category === item
                      ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark'
                      : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                  }`}
                >
                  <Text
                    className={`font-medium text-xs ${
                      category === item ? 'text-white' : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-medium text-sm text-ink dark:text-ink-dark">Tagihan berikutnya</Text>
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
                onChange={(_event, nextDate) => {
                  setShowDate(Platform.OS === 'ios');
                  if (nextDate) setDate(nextDate);
                }}
              />
            )}
          </View>

          {[
            { label: 'Auto-debit', value: autoDebit, onPress: () => setAutoDebit((v) => !v) },
            { label: 'Active reminder', value: active, onPress: () => setActive((v) => !v) },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className="h-14 flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark"
            >
              <Text className="font-medium text-sm text-ink dark:text-ink-dark">{item.label}</Text>
              <View
                className={`h-7 w-12 justify-center rounded-full px-1 ${
                  item.value
                    ? 'items-end bg-secondary dark:bg-secondary-dark'
                    : 'items-start bg-line dark:bg-line-dark'
                }`}
              >
                <View className="h-5 w-5 rounded-full bg-white" />
              </View>
            </Pressable>
          ))}

          <Button title="Simpan Subscription" variant="gradient" loading={create.isPending} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
