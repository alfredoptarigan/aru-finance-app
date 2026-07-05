import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteTransaction, useTransaction } from '@/features/transactions/hooks';
import { formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';

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
  const colors = useThemeColors();
  const { data: t, isPending } = useTransaction(id);
  const deleteTx = useDeleteTransaction();

  const confirmDelete = () =>
    Alert.alert('Hapus transaksi?', 'Tindakan ini tidak bisa dibatalkan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteTx.mutate(id, { onSuccess: () => router.replace('/(tabs)/transactions') }),
      },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text className="font-bold text-xl text-ink dark:text-ink-dark">Detail Transaksi</Text>
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
            <Row label="Tipe" value={t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} />
            <Row label="Kategori" value={t.category?.name ?? '-'} />
            <Row label="Tanggal" value={formatDate(t.transaction_date)} />
            <Row label="Metode" value={t.payment_method?.name ?? '-'} />
            {t.description ? <Row label="Deskripsi" value={t.description} /> : null}
          </Card>

          <Button
            title="Edit Transaksi"
            onPress={() => router.push(`/transaction-form?id=${t.id}`)}
          />
          <Button
            title="Hapus"
            variant="ghost"
            className="border-error dark:border-error-dark"
            loading={deleteTx.isPending}
            onPress={confirmDelete}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
