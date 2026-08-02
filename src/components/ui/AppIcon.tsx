import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View, type ColorValue, type ViewStyle } from 'react-native';

export type AppIconName =
  | 'add'
  | 'back'
  | 'bank'
  | 'budget'
  | 'calendar'
  | 'camera'
  | 'card'
  | 'cash'
  | 'chevronRight'
  | 'close'
  | 'delete'
  | 'document'
  | 'edit'
  | 'error'
  | 'filter'
  | 'goal'
  | 'home'
  | 'insights'
  | 'profile'
  | 'search'
  | 'scan'
  | 'success'
  | 'transactions'
  | 'visibility'
  | 'visibilityOff'
  | 'wallet';

const icons: Record<
  AppIconName,
  { symbol: SymbolViewProps['name']; fallback: keyof typeof Ionicons.glyphMap }
> = {
  add: { symbol: { ios: 'plus', android: 'add', web: 'add' }, fallback: 'add' },
  back: { symbol: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }, fallback: 'chevron-back' },
  bank: { symbol: { ios: 'building.columns', android: 'account_balance', web: 'account_balance' }, fallback: 'business-outline' },
  budget: { symbol: { ios: 'chart.pie', android: 'account_balance_wallet', web: 'account_balance_wallet' }, fallback: 'pie-chart-outline' },
  calendar: { symbol: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }, fallback: 'calendar-outline' },
  camera: { symbol: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' }, fallback: 'camera-outline' },
  card: { symbol: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' }, fallback: 'card-outline' },
  cash: { symbol: { ios: 'banknote', android: 'payments', web: 'payments' }, fallback: 'cash-outline' },
  chevronRight: { symbol: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }, fallback: 'chevron-forward' },
  close: { symbol: { ios: 'xmark', android: 'close', web: 'close' }, fallback: 'close' },
  delete: { symbol: { ios: 'trash', android: 'delete', web: 'delete' }, fallback: 'trash-outline' },
  document: { symbol: { ios: 'doc', android: 'description', web: 'description' }, fallback: 'document-outline' },
  edit: { symbol: { ios: 'pencil', android: 'edit', web: 'edit' }, fallback: 'create-outline' },
  error: { symbol: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }, fallback: 'warning-outline' },
  filter: { symbol: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }, fallback: 'options-outline' },
  goal: { symbol: { ios: 'target', android: 'target', web: 'target' }, fallback: 'flag-outline' },
  home: { symbol: { ios: 'house', android: 'home', web: 'home' }, fallback: 'home-outline' },
  insights: { symbol: { ios: 'chart.line.uptrend.xyaxis', android: 'insights', web: 'insights' }, fallback: 'analytics-outline' },
  profile: { symbol: { ios: 'person', android: 'person', web: 'person' }, fallback: 'person-outline' },
  search: { symbol: { ios: 'magnifyingglass', android: 'search', web: 'search' }, fallback: 'search-outline' },
  scan: { symbol: { ios: 'viewfinder', android: 'document_scanner', web: 'document_scanner' }, fallback: 'scan-outline' },
  success: { symbol: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }, fallback: 'checkmark-circle-outline' },
  transactions: { symbol: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' }, fallback: 'receipt-outline' },
  visibility: { symbol: { ios: 'eye', android: 'visibility', web: 'visibility' }, fallback: 'eye-outline' },
  visibilityOff: { symbol: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }, fallback: 'eye-off-outline' },
  wallet: { symbol: { ios: 'wallet.bifold', android: 'payments', web: 'payments' }, fallback: 'wallet-outline' },
};

export function AppIcon({
  name,
  color,
  size = 22,
  style,
}: {
  name: AppIconName;
  color: ColorValue;
  size?: number;
  style?: ViewStyle;
}) {
  const icon = icons[name];
  const fallback = <Ionicons name={icon.fallback} color={color} size={size} />;

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden>
      <SymbolView
        name={icon.symbol}
        size={size}
        tintColor={color}
        fallback={fallback}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
