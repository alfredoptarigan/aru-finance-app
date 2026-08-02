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
      accessibilityRole="button"
      className="min-h-16 flex-row items-center gap-3 border-b border-line px-1 py-3 active:opacity-70 dark:border-line-dark"
    >
      <CategoryIcon category={t.category} />
      <View className="min-w-0 flex-1">
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
