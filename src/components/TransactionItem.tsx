import { Pressable, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { AmountText } from '@/components/ui/AmountText';
import { formatDate } from '@/lib/currency';
import type { Transaction } from '@/types';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction: t, onPress }: TransactionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-3xl bg-card p-3.5 active:opacity-70 dark:bg-card-dark"
    >
      <CategoryIcon category={t.category} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-semibold text-base text-ink dark:text-ink-dark">
          {t.title}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {formatDate(t.transaction_date, { day: 'numeric', month: 'short' })}
          {t.payment_method ? ` · ${t.payment_method.name}` : ''}
        </Text>
      </View>
      <AmountText
        amount={t.amount}
        tone={t.type === 'income' ? 'income' : 'expense'}
        signed
        size="md"
      />
    </Pressable>
  );
}
