import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { CategoryIcon } from '@/components/CategoryIcon';
import { WalletPicker } from '@/components/WalletPicker';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useScanReceipt } from '@/features/receipts/hooks';
import { useCategories, useCreateTransactions } from '@/features/transactions/hooks';
import { formatCurrency, formatDate } from '@/lib/currency';
import { applyReceiptDiscount } from '@/lib/receipt';
import { useThemeColors } from '@/stores/theme';
import type { ReceiptScan } from '@/types';

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILES = ['image/jpeg', 'image/png', 'application/pdf'];

// ponytail: camera/gallery JPEGs carry an EXIF rotation tag instead of rotated
// pixels. Re-encoding through ImageManipulator bakes in the correct orientation
// and strips EXIF, so backends that read raw pixel buffers don't get sideways
// images (this was the actual cause of receipts failing to OCR from mobile).
async function normalizeReceiptImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (__DEV__) {
    console.log('[ReceiptScan] normalized image', {
      width: result.width,
      height: result.height,
      uri: result.uri,
      base64Bytes: result.base64 ? Math.round((result.base64.length * 3) / 4) : 0,
    });
  }
  return result;
}

export default function ReceiptScanner() {
  const colors = useThemeColors();
  const scan = useScanReceipt();
  const create = useCreateTransactions();
  const categories = useCategories();
  const [draft, setDraft] = useState<ReceiptScan | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  const discountTotal = draft?.discounts.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  const netAmounts = useMemo(
    () => applyReceiptDiscount(draft?.items.map((item) => item.amount) ?? [], discountTotal),
    [discountTotal, draft?.items],
  );
  const selectedIndices = [...selected].sort((a, b) => a - b);
  const selectedTotal = selectedIndices.reduce((sum, index) => sum + (netAmounts[index] ?? 0), 0);
  const expenseCategories = (categories.data ?? []).filter((category) => category.type === 'expense');

  const runScan = (image: string, mediaType: string, uri: string | null, name: string) => {
    setPreviewUri(uri);
    setSourceName(name);
    setDraft(null);
    setSubmitError('');
    scan.mutate(
      { image, media_type: mediaType },
      {
        onSuccess: (result) => {
          setDraft(result);
          setSelected(new Set(result.items.map((_item, index) => index)));
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
      cameraType: ImagePicker.CameraType.back,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (__DEV__) {
      console.log('[ReceiptScan] raw camera asset', { width: asset.width, height: asset.height, uri: asset.uri });
    }

    try {
      const normalized = await normalizeReceiptImage(asset.uri);
      if (!normalized.base64) {
        Alert.alert('Photo could not load', 'Take the photo again.');
        return;
      }
      if (normalized.base64.length * 0.75 > MAX_RECEIPT_BYTES) {
        Alert.alert('Photo too large', 'Retake the photo with more distance or better light.');
        return;
      }
      runScan(normalized.base64, 'image/jpeg', normalized.uri, asset.fileName ?? 'Receipt photo');
    } catch (error) {
      if (__DEV__) console.log('[ReceiptScan] normalize failed', error);
      Alert.alert('Photo could not load', 'Take the photo again.');
    }
  };

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_FILES,
      copyToCacheDirectory: true,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const lowerName = asset.name.toLowerCase();
    const mediaType =
      asset.mimeType ??
      (lowerName.endsWith('.pdf')
        ? 'application/pdf'
        : lowerName.endsWith('.png')
          ? 'image/png'
          : lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')
            ? 'image/jpeg'
            : '');
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
        runScan(base64, mediaType, null, asset.name);
        return;
      }
      const normalized = await normalizeReceiptImage(asset.uri);
      if (!normalized.base64) {
        Alert.alert('File could not load', 'Choose the receipt again.');
        return;
      }
      runScan(normalized.base64, 'image/jpeg', normalized.uri, asset.name);
    } catch (error) {
      if (__DEV__) console.log('[ReceiptScan] normalize failed', error);
      Alert.alert('File could not load', 'Choose the receipt again.');
    }
  };

  const startOver = () => {
    scan.reset();
    setDraft(null);
    setPreviewUri(null);
    setSourceName('');
    setSelected(new Set());
    setErrors({});
    setSubmitError('');
  };

  const toggleItem = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const saveTransactions = () => {
    if (!draft) return;
    const nextErrors: Record<string, string> = {};
    if (!selectedIndices.length) nextErrors.items = 'Choose at least one item';
    if (!categoryId) nextErrors.category = 'Choose a category';
    if (!walletId) nextErrors.wallet = 'Choose a wallet';
    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length) return;

    const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.transaction_date)
      ? draft.transaction_date
      : new Date().toISOString().slice(0, 10);
    const inputs = selectedIndices.map((index) => {
      const item = draft.items[index];
      return {
        type: 'expense' as const,
        amount: netAmounts[index],
        title: item.name.trim() || 'Scanned item',
        description: `Scanned from ${draft.store_name || 'receipt'}. Quantity: ${item.qty}.`,
        category_id: categoryId,
        transaction_date: date,
        payment_method_id: walletId!,
      };
    });

    create.mutate(inputs, {
      onSuccess: (result) => {
        if (result.failedIndices.length) {
          setSelected(new Set(result.failedIndices.map((index) => selectedIndices[index])));
          setSubmitError(
            `${result.created.length} saved, ${result.failedIndices.length} failed. Retry saves only failed items.`,
          );
          return;
        }
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
        setTimeout(() => router.replace('/(tabs)/transactions'), 900);
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <ScreenHeader title="Scan receipt" subtitle="Review every item before it enters your ledger." back />

        {!draft ? (
          <>
            <View className="overflow-hidden rounded-2xl border border-line bg-card dark:border-line-dark dark:bg-card-dark">
              {previewUri ? (
                <Image source={{ uri: previewUri }} contentFit="contain" style={{ width: '100%', height: 260 }} />
              ) : (
                <View className="h-64 items-center justify-center gap-4 px-8">
                  <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15">
                    <AppIcon name="scan" size={38} color={colors.primary} />
                  </View>
                  <View className="items-center gap-1">
                    <Text className="font-bold text-xl text-ink dark:text-ink-dark">Keep the receipt flat</Text>
                    <Text className="text-center text-sm leading-5 text-muted dark:text-muted-dark">Use even light and keep all totals inside the frame.</Text>
                  </View>
                </View>
              )}
            </View>

            {scan.isPending ? (
              <View className="gap-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary-dark/15">
                    <AppIcon name="scan" size={20} color={colors.primary} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Reading {sourceName || 'receipt'}</Text>
                    <Text className="text-xs text-muted dark:text-muted-dark">Finding merchant, date, items, and discounts.</Text>
                  </View>
                </View>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </View>
            ) : (
              <View className="gap-3">
                {scan.error ? (
                  <View className="rounded-xl border border-error/40 p-4 dark:border-error-dark/40">
                    <Text className="font-semibold text-sm text-error dark:text-error-dark">Receipt could not be read</Text>
                    <Text className="mt-1 text-xs text-muted dark:text-muted-dark">Try another image with sharper text and even light.</Text>
                  </View>
                ) : null}
                <Button title="Take photo" onPress={() => void takePhoto()} />
                <Button title="Choose photo or PDF" variant="quiet" onPress={() => void chooseFile()} />
              </View>
            )}
          </>
        ) : (
          <>
            <View className="rounded-2xl bg-ink p-5 dark:bg-card-dark">
              <Text className="text-sm text-white/65">{draft.store_name || 'Receipt'}</Text>
              <Text className="mt-1 font-extrabold tabular-nums text-4xl text-white">{formatCurrency(selectedTotal)}</Text>
              <View className="mt-4 flex-row justify-between border-t border-white/15 pt-4">
                <Text className="text-xs text-white/70">{formatDate(draft.transaction_date)}</Text>
                <Text className="text-xs text-white/70">{selected.size} of {draft.items.length} items</Text>
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-base text-ink dark:text-ink-dark">Line items</Text>
                <Pressable accessibilityRole="button" onPress={() => setSelected(new Set(draft.items.map((_item, index) => index)))} className="min-h-11 justify-center px-1">
                  <Text className="font-semibold text-xs text-primary dark:text-primary-dark">Select all</Text>
                </Pressable>
              </View>
              {errors.items ? <Text className="text-xs text-error dark:text-error-dark">{errors.items}</Text> : null}
              <View className="border-t border-line dark:border-line-dark">
                {draft.items.map((item, index) => {
                  const active = selected.has(index);
                  return (
                    <Pressable
                      key={`${item.name}-${index}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      onPress={() => toggleItem(index)}
                      className="min-h-16 flex-row items-center gap-3 border-b border-line py-3 active:opacity-70 dark:border-line-dark"
                    >
                      <View className={`h-6 w-6 items-center justify-center rounded-md border ${active ? 'border-primary bg-primary dark:border-primary-dark dark:bg-primary-dark' : 'border-line dark:border-line-dark'}`}>
                        {active ? <AppIcon name="success" size={16} color="#fff" /> : null}
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="font-medium text-sm text-ink dark:text-ink-dark">{item.name}</Text>
                        <Text className="text-xs text-muted dark:text-muted-dark">Quantity {item.qty}</Text>
                      </View>
                      <Text className="shrink-0 font-semibold tabular-nums text-sm text-ink dark:text-ink-dark">{formatCurrency(netAmounts[index])}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {draft.discounts.length ? (
              <View className="gap-2 border-l-2 border-secondary pl-4 dark:border-secondary-dark">
                <Text className="font-semibold text-sm text-ink dark:text-ink-dark">Receipt discounts</Text>
                {draft.discounts.map((discount, index) => (
                  <View key={`${discount.name}-${index}`} className="flex-row justify-between gap-3">
                    <Text numberOfLines={1} className="min-w-0 flex-1 text-xs text-muted dark:text-muted-dark">{discount.name}</Text>
                    <Text className="shrink-0 font-semibold tabular-nums text-xs text-secondary dark:text-secondary-dark">-{formatCurrency(discount.amount)}</Text>
                  </View>
                ))}
                <Text className="text-xs text-muted dark:text-muted-dark">Discounts are distributed across line items.</Text>
              </View>
            ) : null}

            <View className="gap-2">
              <Text className="font-medium text-sm text-ink dark:text-ink-dark">Category</Text>
              {errors.category ? <Text className="text-xs text-error dark:text-error-dark">{errors.category}</Text> : null}
              {categories.isPending ? (
                <Skeleton className="h-14 w-full" />
              ) : categories.isError ? (
                <Button title="Retry categories" variant="quiet" onPress={() => void categories.refetch()} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                  {expenseCategories.map((category) => {
                    const active = category.id === categoryId;
                    return (
                      <Pressable
                        key={category.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setCategoryId(category.id);
                        }}
                        className={`min-h-14 flex-row items-center gap-2 rounded-xl border px-3 ${active ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10' : 'border-line bg-card dark:border-line-dark dark:bg-card-dark'}`}
                      >
                        <CategoryIcon category={category} size={32} />
                        <Text className="font-medium text-sm text-ink dark:text-ink-dark">{category.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <WalletPicker value={walletId} onChange={setWalletId} error={errors.wallet} helper="Selected total will be debited from this wallet." />

            {submitError ? <Text className="text-sm text-error dark:text-error-dark">{submitError}</Text> : null}
            <Button title={`Save ${selected.size} ${selected.size === 1 ? 'transaction' : 'transactions'}`} loading={create.isPending} disabled={!selected.size} onPress={saveTransactions} />
            <Button title="Scan another receipt" variant="quiet" disabled={create.isPending} onPress={startOver} />
          </>
        )}
      </ScrollView>

      {done ? (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <Animated.View entering={ZoomIn.duration(260).reduceMotion(ReduceMotion.System)} className="h-24 w-24 items-center justify-center rounded-2xl bg-secondary dark:bg-secondary-dark">
            <AppIcon name="success" size={52} color="#fff" />
          </Animated.View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
