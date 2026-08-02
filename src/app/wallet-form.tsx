import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCreateWallet, useDeleteWallet, useUpdateWallet, useWallet } from '@/features/wallets/hooks';
import { WALLET_TYPES } from '@/features/wallets/options';
import { useThemeColors } from '@/stores/theme';
import type { PaymentMethodType } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Wallet name is required').max(50, 'Use 50 characters or fewer'),
  type: z.enum(['cash', 'bank', 'e_wallet', 'credit_card', 'paylater']),
  account_number: z.string().max(50, 'Use 50 characters or fewer').nullable(),
  balance: z.number().finite('Enter a valid balance'),
});

export default function WalletForm() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;
  const colors = useThemeColors();
  const wallet = useWallet(params.id ?? '');
  const create = useCreateWallet();
  const update = useUpdateWallet(params.id ?? '');
  const remove = useDeleteWallet();
  const mutation = isEdit ? update : create;
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!wallet.data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(wallet.data.name);
    setType(wallet.data.type);
    setAccountNumber(wallet.data.account_number ?? '');
    setBalance(String(wallet.data.balance));
  }, [wallet.data]);

  const submit = () => {
    if (!balance.trim()) {
      setErrors({ balance: 'Balance is required' });
      return;
    }
    const parsed = schema.safeParse({
      name: name.trim(),
      type,
      account_number: accountNumber.trim() || null,
      balance: Number(balance),
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
    });
  };

  const confirmDelete = () =>
    Alert.alert('Delete wallet?', 'Transactions will remain, but this wallet will no longer be available.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(params.id!, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">{isEdit ? 'Edit wallet' : 'New wallet'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close wallet form" onPress={() => router.back()} className="h-11 w-11 items-center justify-center">
            <AppIcon name="close" color={colors.muted} />
          </Pressable>
        </View>

        {isEdit && wallet.isPending ? (
          <View className="gap-3 px-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-14 w-full" />
          </View>
        ) : isEdit && wallet.isError ? (
          <View className="gap-3 px-5">
            <View className="rounded-xl border border-error/40 p-4 dark:border-error-dark/40">
              <Text className="font-semibold text-sm text-error dark:text-error-dark">Wallet could not load</Text>
              <Text className="mt-1 text-xs text-muted dark:text-muted-dark">Check your connection, then retry.</Text>
            </View>
            <Button title="Retry" variant="quiet" onPress={() => void wallet.refetch()} />
          </View>
        ) : (
          <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
            <Input label="Wallet name" icon="wallet-outline" placeholder="For example, BCA" value={name} maxLength={50} onChangeText={setName} error={errors.name} />

            <View className="gap-2">
              <Text className="font-medium text-sm text-ink dark:text-ink-dark">Wallet type</Text>
              <View className="gap-2">
                {WALLET_TYPES.map((option) => {
                  const selected = type === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setType(option.value);
                      }}
                      className={`min-h-14 flex-row items-center gap-3 rounded-xl border px-4 active:scale-[0.98] ${
                        selected
                          ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10'
                          : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'
                      }`}
                    >
                      <AppIcon name={option.icon} color={selected ? colors.primary : colors.muted} />
                      <Text className="flex-1 font-medium text-sm text-ink dark:text-ink-dark">{option.label}</Text>
                      {selected ? <AppIcon name="success" size={20} color={colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input label="Account number (optional)" icon="keypad-outline" placeholder="Account or card reference" value={accountNumber} maxLength={50} onChangeText={setAccountNumber} error={errors.account_number} />

            <View className="gap-1.5">
              <Text className="font-medium text-sm text-ink dark:text-ink-dark">Current balance</Text>
              <View className={`min-h-14 flex-row items-center rounded-xl border bg-card px-4 dark:bg-card-dark ${errors.balance ? 'border-error dark:border-error-dark' : 'border-line dark:border-line-dark'}`}>
                <Text className="mr-2 font-medium text-base text-muted dark:text-muted-dark">Rp</Text>
                <TextInput
                  className="flex-1 font-sans tabular-nums text-base text-ink dark:text-ink-dark"
                  keyboardType="numbers-and-punctuation"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={balance}
                  onChangeText={(value) => setBalance(value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, ''))}
                />
              </View>
              {errors.balance ? <Text className="text-xs text-error dark:text-error-dark">{errors.balance}</Text> : null}
              <Text className="text-xs text-muted dark:text-muted-dark">Use a negative value for debt or outstanding credit.</Text>
            </View>

            {mutation.error || remove.error ? <Text className="text-sm text-error dark:text-error-dark">{(mutation.error ?? remove.error)?.message}</Text> : null}
            <Button title={isEdit ? 'Save changes' : 'Create wallet'} loading={mutation.isPending} onPress={submit} />
            {isEdit ? <Button title="Delete wallet" variant="danger" loading={remove.isPending} onPress={confirmDelete} /> : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
