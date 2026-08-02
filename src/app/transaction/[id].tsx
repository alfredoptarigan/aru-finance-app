import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteTransaction, useTransaction } from '@/features/transactions/hooks';
import { formatDate } from '@/lib/currency';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-sm text-muted dark:text-muted-dark">{label}</Text>
      <Text className="font-medium text-sm text-ink dark:text-ink-dark">{value}</Text>
    </View>
  );
}

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: t, isPending } = useTransaction(id);
  const deleteTx = useDeleteTransaction();

  const confirmDelete = () =>
    Alert.alert('Delete transaction?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTx.mutate(id, { onSuccess: () => router.replace('/(tabs)/transactions') }),
      },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="px-5 py-4">
        <ScreenHeader title="Transaction details" back />
      </View>

      {isPending || !t ? (
        <View className="gap-3 px-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
          <Card className="items-center gap-3 py-8">
            <CategoryIcon category={t.category} size={64} />
            <Text className="font-semibold text-lg text-ink dark:text-ink-dark">{t.title}</Text>
            <AmountText
              amount={t.amount}
              tone={t.type === 'income' ? 'income' : 'expense'}
              size="xl"
              signed
            />
          </Card>

          <Card>
            <Row label="Type" value={t.type === 'income' ? 'Income' : 'Expense'} />
            <Row label="Category" value={t.category?.name ?? '-'} />
            <Row label="Date" value={formatDate(t.transaction_date)} />
            <Row label="Payment method" value={t.payment_method?.name ?? '-'} />
            {t.description ? <Row label="Description" value={t.description} /> : null}
          </Card>

          <Button
            title="Edit transaction"
            onPress={() => router.push(`/transaction-form?id=${t.id}`)}
          />
          <Button
            title="Delete"
            variant="quiet"
            className="border-error dark:border-error-dark"
            loading={deleteTx.isPending}
            onPress={confirmDelete}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
