import type { AppIconName } from '@/components/ui/AppIcon';
import type { PaymentMethodType } from '@/types';

export const WALLET_TYPES: {
  value: PaymentMethodType;
  label: string;
  icon: AppIconName;
}[] = [
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'bank', label: 'Bank account', icon: 'bank' },
  { value: 'e_wallet', label: 'E-wallet', icon: 'wallet' },
  { value: 'credit_card', label: 'Credit card', icon: 'card' },
  { value: 'paylater', label: 'Paylater', icon: 'card' },
];

export function walletType(type: PaymentMethodType) {
  return WALLET_TYPES.find((item) => item.value === type) ?? WALLET_TYPES[0];
}
