import { Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { formatCurrency, formatDate } from '@/lib/currency';
import { getSplitBillDisplayStatus, type SplitBill, type SplitBillBreakdown } from '@/types';

// ponytail: fixed light palette classes only (no `dark:` variants) — this card
// is captured as a shared PNG, so it must render the same regardless of the
// device's current theme.
export function SplitBillShareCard({ bill, breakdown }: { bill: SplitBill; breakdown: SplitBillBreakdown }) {
  const status = getSplitBillDisplayStatus(bill);

  return (
    <View collapsable={false} className="w-[380px] gap-6 rounded-[28px] bg-card p-7">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <View className="h-5 w-5 items-center justify-center rounded-md bg-primary">
            <AppIcon name="wallet" size={11} color="#fff" />
          </View>
          <Text className="font-semibold text-[11px] uppercase tracking-[0.12em] text-muted">Ledgeria</Text>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${status === 'Selesai' ? 'bg-secondary/15' : 'bg-line/70'}`}>
          <Text className={`font-semibold text-[10px] uppercase tracking-wide ${status === 'Selesai' ? 'text-secondary' : 'text-muted'}`}>
            {status}
          </Text>
        </View>
      </View>

      <View className="gap-1">
        <Text numberOfLines={2} className="font-extrabold text-2xl leading-7 text-ink">
          {bill.merchant_name || 'Tanpa nama'}
        </Text>
        <Text className="text-xs text-muted">
          {formatDate(bill.bill_date)} · {breakdown.participants.length} orang
        </Text>
      </View>

      <View className="gap-1 border-t border-line pt-5">
        <Text className="text-xs text-muted">Total ditanggung bersama</Text>
        <Text className="font-extrabold tabular-nums text-4xl text-ink">{formatCurrency(breakdown.grand_total)}</Text>
      </View>

      <View className="gap-3 border-t border-line pt-5">
        {breakdown.participants.map((participant) => (
          <View key={participant.participant_id} className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Text className="font-bold text-xs text-primary">{(participant.name.trim()[0] ?? '?').toUpperCase()}</Text>
            </View>
            <Text numberOfLines={1} className="min-w-0 flex-1 font-medium text-sm text-ink">
              {participant.name || 'Tanpa nama'}
            </Text>
            <Text className="tabular-nums font-semibold text-sm text-ink">{formatCurrency(participant.total)}</Text>
            <View className={`rounded-full px-2 py-0.5 ${participant.is_paid ? 'bg-secondary/15' : 'bg-line/70'}`}>
              <Text className={`font-semibold text-[9px] ${participant.is_paid ? 'text-secondary' : 'text-muted'}`}>
                {participant.is_paid ? 'Lunas' : 'Belum'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View className="gap-1.5 border-t border-line pt-5">
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted">Subtotal item</Text>
          <Text className="tabular-nums text-xs text-ink">{formatCurrency(breakdown.items_subtotal)}</Text>
        </View>
        {breakdown.discount_total > 0 ? (
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Diskon</Text>
            <Text className="tabular-nums text-xs text-secondary">-{formatCurrency(breakdown.discount_total)}</Text>
          </View>
        ) : null}
        {breakdown.fee_total > 0 ? (
          <View className="flex-row justify-between">
            <Text className="text-xs text-muted">Biaya</Text>
            <Text className="tabular-nums text-xs text-ink">{formatCurrency(breakdown.fee_total)}</Text>
          </View>
        ) : null}
      </View>

      <Text className="text-center text-[10px] text-muted">Dibuat dengan Ledgeria</Text>
    </View>
  );
}
