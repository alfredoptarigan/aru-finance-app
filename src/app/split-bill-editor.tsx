import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdjustmentList } from '@/features/split-bills/AdjustmentList';
import { BreakdownCard } from '@/features/split-bills/BreakdownCard';
import { ItemList } from '@/features/split-bills/ItemList';
import { ParticipantList } from '@/features/split-bills/ParticipantList';
import {
  useCreateSplitBill,
  useFinalizeSplitBill,
  useScanSplitBill,
  useSplitBill,
  useUpdateSplitBill,
} from '@/features/split-bills/hooks';
import { createId } from '@/lib/id';
import { computeSplitBillBreakdown } from '@/lib/split-bill-calculator';
import { normalizeReceiptImage } from '@/lib/normalize-receipt-image';
import { useThemeColors } from '@/stores/theme';
import type { SplitBillAdjustment, SplitBillData } from '@/types';

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILES = ['image/jpeg', 'image/png', 'application/pdf'];
const today = () => new Date().toISOString().slice(0, 10);

function defaultData(): SplitBillData {
  return { participants: [{ id: createId(), name: 'Saya', is_paid: false }], items: [], adjustments: [] };
}

export default function SplitBillEditor() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ id?: string }>();
  const billId = params.id;
  const isEdit = !!billId;

  const existing = useSplitBill(billId ?? '');
  const scan = useScanSplitBill();
  const create = useCreateSplitBill();
  const update = useUpdateSplitBill(billId ?? '');
  const finalize = useFinalizeSplitBill(billId ?? '');

  const [merchantName, setMerchantName] = useState('');
  const [billDate, setBillDate] = useState(today());
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [data, setData] = useState<SplitBillData>(defaultData());
  const [submitError, setSubmitError] = useState('');
  const [finalizeErrors, setFinalizeErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!existing.data) return;
    const { bill } = existing.data;
    if (bill.status === 'final') {
      router.replace(`/split-bill/${bill.id}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMerchantName(bill.merchant_name);
    setBillDate(bill.bill_date);
    setReceiptTotal(bill.receipt_total);
    setData(bill.data);
  }, [existing.data]);

  const breakdown = useMemo(() => computeSplitBillBreakdown(data.participants, data.items, data.adjustments), [data]);

  const clientErrors = useMemo(() => {
    const errors: string[] = [];
    if (data.participants.length === 0) errors.push('Add at least one participant.');
    if (data.participants.some((p) => !p.name.trim())) errors.push('Every participant needs a name.');
    const names = data.participants.map((p) => p.name.trim().toLowerCase()).filter(Boolean);
    if (new Set(names).size !== names.length) errors.push('Participant names must be unique.');
    if (data.items.length === 0) errors.push('Add at least one item.');
    if (data.items.some((item) => item.amount <= 0)) errors.push('Every item needs an amount greater than 0.');
    if (data.items.some((item) => item.participant_ids.length === 0)) errors.push('Every item needs at least one participant.');
    if (breakdown.discount_total > breakdown.items_subtotal) errors.push('Total discount cannot exceed the item subtotal.');
    if (breakdown.grand_total !== receiptTotal) errors.push('Split total must match the receipt total.');
    return errors;
  }, [data, breakdown, receiptTotal]);

  const runScan = async (file: string, mediaType: string) => {
    setSubmitError('');
    scan.mutate(
      { file, media_type: mediaType },
      {
        onSuccess: (result) => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMerchantName(result.merchant_name);
          setBillDate(/^\d{4}-\d{2}-\d{2}$/.test(result.bill_date) ? result.bill_date : today());
          setReceiptTotal(result.grand_total);
          setData((current) => ({
            ...current,
            items: result.items.map((item) => ({ id: createId(), name: item.name, qty: item.qty, amount: item.amount, participant_ids: [] })),
            adjustments: [
              ...result.discounts.map((d): SplitBillAdjustment => ({ id: createId(), name: d.name, kind: 'discount', amount: d.amount })),
              ...result.fees.map((f): SplitBillAdjustment => ({ id: createId(), name: f.name, kind: 'fee', amount: f.amount })),
            ],
          }));
        },
      },
    );
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Allow camera access to photograph a receipt.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false });
    if (result.canceled) return;
    try {
      const normalized = await normalizeReceiptImage(result.assets[0].uri);
      if (!normalized.base64 || normalized.base64.length * 0.75 > MAX_RECEIPT_BYTES) {
        Alert.alert('Photo could not load', 'Retake the photo with more distance or better light.');
        return;
      }
      await runScan(normalized.base64, 'image/jpeg');
    } catch {
      Alert.alert('Photo could not load', 'Take the photo again.');
    }
  };

  const chooseFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library permission needed', 'Allow photo access to choose a receipt image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (result.canceled) return;
    try {
      const normalized = await normalizeReceiptImage(result.assets[0].uri);
      if (!normalized.base64 || normalized.base64.length * 0.75 > MAX_RECEIPT_BYTES) {
        Alert.alert('Photo too large', 'Choose a smaller image, or retake with less detail.');
        return;
      }
      await runScan(normalized.base64, 'image/jpeg');
    } catch {
      Alert.alert('Photo could not load', 'Choose the photo again.');
    }
  };

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ALLOWED_FILES, copyToCacheDirectory: true, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const lowerName = asset.name.toLowerCase();
    const mediaType =
      asset.mimeType ?? (lowerName.endsWith('.pdf') ? 'application/pdf' : lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg');
    if (!ALLOWED_FILES.includes(mediaType)) {
      Alert.alert('Unsupported file', 'Choose a JPEG, PNG, or PDF receipt.');
      return;
    }
    if (asset.size && asset.size > MAX_RECEIPT_BYTES) {
      Alert.alert('File too large', 'Receipt files can be up to 10 MB.');
      return;
    }
    try {
      if (mediaType === 'application/pdf') {
        const base64 = asset.base64 ?? (await new File(asset.uri).base64());
        await runScan(base64, mediaType);
        return;
      }
      const normalized = await normalizeReceiptImage(asset.uri);
      if (!normalized.base64) {
        Alert.alert('File could not load', 'Choose the receipt again.');
        return;
      }
      await runScan(normalized.base64, 'image/jpeg');
    } catch {
      Alert.alert('File could not load', 'Choose the receipt again.');
    }
  };

  const buildInput = () => ({
    merchant_name: merchantName.trim(),
    bill_date: billDate,
    currency: 'IDR' as const,
    receipt_total: receiptTotal,
    data,
  });

  const saveDraft = (onSuccess?: (id: string) => void) => {
    setSubmitError('');
    const mutation = isEdit ? update : create;
    mutation.mutate(buildInput(), {
      onSuccess: (bill) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaved(true);
        setTimeout(() => setSaved(false), 900);
        if (!isEdit) router.setParams({ id: bill.id });
        onSuccess?.(bill.id);
      },
      onError: (error) => setSubmitError(error.message),
    });
  };

  const finalizeBill = () => {
    setFinalizeErrors([]);
    setSubmitError('');
    saveDraft((id) => {
      finalize.mutate(undefined, {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace(`/split-bill/${id}`);
        },
        onError: (error) => {
          const details = (error as unknown as { details?: { errors?: string[] } }).details;
          setFinalizeErrors(details?.errors ?? [error.message]);
        },
      });
    });
  };

  const saving = create.isPending || update.isPending;
  const loading = isEdit && existing.isPending;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2" keyboardShouldPersistTaps="handled">
          <ScreenHeader title={isEdit ? 'Edit draft' : 'New split bill'} subtitle="Divide a receipt between everyone who shared it." back />

          {loading ? (
            <View className="gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </View>
          ) : (
            <>
              {data.items.length === 0 ? (
                <View className="gap-3">
                  {scan.isPending ? (
                    <View className="flex-row items-center gap-3 rounded-xl border border-line bg-card p-4 dark:border-line-dark dark:bg-card-dark">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15">
                        <AppIcon name="scan" size={20} color={colors.primary} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Reading receipt</Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">Finding merchant, items, discounts, and fees.</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {scan.error ? (
                        <View className="rounded-xl border border-error/40 p-4 dark:border-error-dark/40">
                          <Text className="font-semibold text-sm text-error dark:text-error-dark">Receipt could not be read</Text>
                          <Text className="mt-1 text-xs text-muted dark:text-muted-dark">Try another image, or fill in items manually below.</Text>
                        </View>
                      ) : null}
                      <Button title="Take photo" onPress={() => void takePhoto()} />
                      <View className="flex-row gap-3">
                        <Button title="Choose from gallery" variant="quiet" onPress={() => void chooseFromGallery()} className="flex-1" />
                        <Button title="Browse files" variant="quiet" onPress={() => void chooseFile()} className="flex-1" />
                      </View>
                      <Text className="text-center text-xs text-muted dark:text-muted-dark">Or add items manually below.</Text>
                    </>
                  )}
                </View>
              ) : null}

              <View className="gap-3">
                <Input label="Merchant" placeholder="e.g. Kopi Tuku" value={merchantName} onChangeText={setMerchantName} />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="mb-1.5 font-medium text-sm text-ink dark:text-ink-dark">Date</Text>
                    <TextInput
                      className="min-h-14 rounded-xl border border-line bg-card px-4 font-sans text-base text-ink dark:border-line-dark dark:bg-card-dark dark:text-ink-dark"
                      value={billDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.muted}
                      onChangeText={setBillDate}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1.5 font-medium text-sm text-ink dark:text-ink-dark">Receipt total</Text>
                    <View className="min-h-14 flex-row items-center rounded-xl border border-line bg-card px-4 dark:border-line-dark dark:bg-card-dark">
                      <Text className="mr-2 font-medium text-base text-muted dark:text-muted-dark">Rp</Text>
                      <TextInput
                        className="flex-1 tabular-nums font-sans text-base text-ink dark:text-ink-dark"
                        value={receiptTotal ? String(receiptTotal) : ''}
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        keyboardType="number-pad"
                        onChangeText={(text) => setReceiptTotal(Math.max(0, Math.round(Number(text.replace(/[^\d]/g, '')) || 0)))}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <ParticipantList participants={data.participants} onChange={(participants) => setData((d) => ({ ...d, participants }))} />
              <ItemList items={data.items} participants={data.participants} onChange={(items) => setData((d) => ({ ...d, items }))} />
              <AdjustmentList adjustments={data.adjustments} onChange={(adjustments) => setData((d) => ({ ...d, adjustments }))} />

              <BreakdownCard breakdown={breakdown} receiptTotal={receiptTotal} />

              {finalizeErrors.length ? (
                <View className="gap-1 rounded-xl border border-error/40 p-4 dark:border-error-dark/40">
                  <Text className="font-semibold text-sm text-error dark:text-error-dark">Bill could not be finalized</Text>
                  {finalizeErrors.map((error, index) => (
                    <Text key={index} className="text-xs text-error dark:text-error-dark">
                      • {error}
                    </Text>
                  ))}
                </View>
              ) : null}
              {submitError ? <Text className="text-sm text-error dark:text-error-dark">{submitError}</Text> : null}

              <Button title={saved ? 'Saved' : 'Simpan Draft'} variant="quiet" loading={saving} onPress={() => saveDraft()} />
              <Button
                title="Finalisasi"
                loading={finalize.isPending}
                disabled={clientErrors.length > 0 || finalize.isPending || saving}
                onPress={finalizeBill}
              />
              {clientErrors.length ? (
                <Animated.View entering={FadeIn.duration(150)} className="gap-1">
                  {clientErrors.map((error, index) => (
                    <Text key={index} className="text-xs text-muted dark:text-muted-dark">
                      • {error}
                    </Text>
                  ))}
                </Animated.View>
              ) : null}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
