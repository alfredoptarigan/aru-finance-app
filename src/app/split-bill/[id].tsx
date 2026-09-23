import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteSplitBill, useSetSplitBillPaid, useSplitBill } from '@/features/split-bills/hooks';
import { SplitBillShareCard } from '@/features/split-bills/ShareCard';
import { formatCurrency, formatDate } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import { getSplitBillDisplayStatus } from '@/types';

export default function SplitBillDetail() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id: string }>();
  const detail = useSplitBill(params.id);
  const setPaid = useSetSplitBillPaid(params.id);
  const remove = useDeleteSplitBill();
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const bill = detail.data?.bill;
  const breakdown = detail.data?.breakdown;

  const shareTextFallback = () => {
    if (!bill || !breakdown) return;
    const lines = breakdown.participants.map(
      (p) => `${p.name}: ${formatCurrency(p.total)} (${p.is_paid ? 'Lunas' : 'Belum bayar'})`,
    );
    void Share.share({
      message: `${bill.merchant_name || 'Split Bill'} - ${formatDate(bill.bill_date)}\nTotal: ${formatCurrency(breakdown.grand_total)}\n\n${lines.join('\n')}`,
    });
  };

  const shareSummary = async () => {
    if (!bill || !breakdown || !shareCardRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Bagikan ringkasan split bill' });
      } else {
        shareTextFallback();
      }
    } catch (error) {
      if (__DEV__) console.log('[SplitBillShare] capture failed', error);
      shareTextFallback();
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () => {
    if (!bill) return;
    Alert.alert('Delete split bill?', `"${bill.merchant_name || 'This bill'}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(bill.id, { onSuccess: () => router.back() }) },
    ]);
  };

  const togglePaid = (participantId: string, current: boolean) => {
    void Haptics.selectionAsync();
    setPaid.mutate({ participant_id: participantId, is_paid: !current });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <ScreenHeader
          title="Split Bill"
          subtitle={bill ? `${bill.merchant_name || 'Tanpa nama'} · ${formatDate(bill.bill_date)}` : undefined}
          back
          action={{ icon: 'document', label: 'Share summary', onPress: () => void shareSummary() }}
        />

        {bill && breakdown ? (
          <View
            collapsable={false}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, zIndex: -1 }}
          >
            <View ref={shareCardRef} collapsable={false}>
              <SplitBillShareCard bill={bill} breakdown={breakdown} />
            </View>
          </View>
        ) : null}

        {detail.isPending ? (
          <View className="gap-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </View>
        ) : detail.isError || !bill || !breakdown ? (
          <View className="gap-3 rounded-xl border border-error/30 p-5 dark:border-error-dark/30">
            <EmptyState icon="alert-circle-outline" title="Split bill not found" subtitle="It may have been deleted, or failed to load." />
            <Button title="Retry" variant="quiet" onPress={() => void detail.refetch()} />
          </View>
        ) : (
          <>
            <Animated.View entering={FadeIn.duration(200)} className="gap-3 rounded-2xl bg-ink p-5 dark:bg-card-dark">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-white/65">{getSplitBillDisplayStatus(bill)}</Text>
                {getSplitBillDisplayStatus(bill) === 'Selesai' ? <AppIcon name="success" size={20} color="#7DE0A8" /> : null}
              </View>
              <Text className="font-extrabold tabular-nums text-4xl text-white">{formatCurrency(breakdown.grand_total)}</Text>
              <Text className="text-xs text-white/70">{breakdown.participants.length} participants</Text>
            </Animated.View>

            <View className="gap-2">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">Who owes what</Text>
              <View className="border-t border-line dark:border-line-dark">
                {breakdown.participants.map((participant) => (
                  <Animated.View
                    key={participant.participant_id}
                    layout={LinearTransition.springify().damping(18)}
                    className="min-h-16 flex-row items-center gap-3 border-b border-line py-3 dark:border-line-dark"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10 dark:bg-primary-dark/15">
                      <Text className="font-bold text-xs text-primary dark:text-primary-dark">
                        {(participant.name.trim()[0] ?? '?').toUpperCase()}
                      </Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="font-medium text-sm text-ink dark:text-ink-dark">{participant.name}</Text>
                      <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">{formatCurrency(participant.total)}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mark ${participant.name} as ${participant.is_paid ? 'belum bayar' : 'lunas'}`}
                      accessibilityState={{ selected: participant.is_paid }}
                      disabled={setPaid.isPending}
                      onPress={() => togglePaid(participant.participant_id, participant.is_paid)}
                      className={`min-h-9 justify-center rounded-full border px-3 active:scale-95 ${
                        participant.is_paid
                          ? 'border-secondary bg-secondary/10 dark:border-secondary-dark dark:bg-secondary-dark/15'
                          : 'border-line dark:border-line-dark'
                      }`}
                    >
                      <Text className={`font-semibold text-xs ${participant.is_paid ? 'text-secondary dark:text-secondary-dark' : 'text-muted dark:text-muted-dark'}`}>
                        {participant.is_paid ? 'Lunas' : 'Belum bayar'}
                      </Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>

            <View className="gap-1.5 rounded-xl border border-line p-4 dark:border-line-dark">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted dark:text-muted-dark">Items subtotal</Text>
                <Text className="tabular-nums text-xs text-ink dark:text-ink-dark">{formatCurrency(breakdown.items_subtotal)}</Text>
              </View>
              {breakdown.discount_total > 0 ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted dark:text-muted-dark">Discount</Text>
                  <Text className="tabular-nums text-xs text-secondary dark:text-secondary-dark">-{formatCurrency(breakdown.discount_total)}</Text>
                </View>
              ) : null}
              {breakdown.fee_total > 0 ? (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted dark:text-muted-dark">Fee</Text>
                  <Text className="tabular-nums text-xs text-ink dark:text-ink-dark">{formatCurrency(breakdown.fee_total)}</Text>
                </View>
              ) : null}
            </View>

            <Button title="Share summary" variant="quiet" loading={sharing} onPress={() => void shareSummary()} />
            <Pressable
              onPress={confirmDelete}
              accessibilityRole="button"
              className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-error/40 active:opacity-70 dark:border-error-dark/40"
            >
              <AppIcon name="delete" size={18} color={colors.error} />
              <Text className="font-semibold text-base text-error dark:text-error-dark">Delete split bill</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
