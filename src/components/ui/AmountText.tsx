import { Text } from 'react-native';

import { formatCurrency } from '@/lib/currency';

type Tone = 'default' | 'income' | 'expense' | 'inverse';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const toneClass: Record<Tone, string> = {
  default: 'text-ink dark:text-ink-dark',
  income: 'text-secondary dark:text-secondary-dark',
  expense: 'text-error dark:text-error-dark',
  inverse: 'text-white',
};

const sizeClass: Record<Size, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
  xl: 'text-4xl font-extrabold',
};

interface AmountTextProps {
  amount: number;
  tone?: Tone;
  size?: Size;
  signed?: boolean;
  className?: string;
}

export function AmountText({
  amount,
  tone = 'default',
  size = 'md',
  signed = false,
  className = '',
}: AmountTextProps) {
  const prefix = signed ? (tone === 'income' ? '+' : tone === 'expense' ? '-' : '') : '';
  return (
    <Text className={`${sizeClass[size]} ${toneClass[tone]} ${className}`}>
      {prefix}
      {formatCurrency(Math.abs(amount))}
    </Text>
  );
}
