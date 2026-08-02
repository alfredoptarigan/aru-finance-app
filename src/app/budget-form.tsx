import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/Button';
import {
  type BudgetPlanBucketInput,
  useBudgetPlan,
  useBudgets,
  useCreateBudget,
  useCreateBudgetPlan,
  useDeleteBudget,
  useBudgetPlanAvailableBalance,
  useUpdateBudget,
  useUpdateBudgetPlan,
} from '@/features/budgets/hooks';
import { useCategories } from '@/features/transactions/hooks';
import { formatCurrency } from '@/lib/currency';
import { useThemeColors } from '@/stores/theme';
import type { BudgetPlanBucketKey, BudgetPlanSource } from '@/types';

interface DraftBucket {
  key: BudgetPlanBucketKey;
  name: string;
  description: string;
  icon: string;
  color: string;
  percent: string;
  categories: string[];
}

const defaultRows: DraftBucket[] = [
  {
    key: 'operational',
    name: 'Essentials',
    description: 'Shopping, health, transport, and other essentials',
    icon: 'cart-outline',
    color: '#B65F47',
    percent: '50',
    categories: ['Shopping', 'Health', 'Transport', 'Other'],
  },
  {
    key: 'fun',
    name: 'Flexible',
    description: 'Food and entertainment',
    icon: 'fast-food-outline',
    color: '#A66F2C',
    percent: '10',
    categories: ['Food', 'Entertainment'],
  },
  {
    key: 'investing',
    name: 'Savings / investing',
    description: 'Long-term savings and investments',
    icon: 'trending-up-outline',
    color: '#4F745E',
    percent: '40',
    categories: ['Investing'],
  },
];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonth(key: string) {
  const [year, month] = key.split('-').map(Number);
  return { month, year };
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, 1),
  );
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, '');
}

const iconAliases: Record<string, keyof typeof Ionicons.glyphMap> = {
  cart: 'cart-outline',
  car: 'car-outline',
  'fast-food': 'fast-food-outline',
  wallet: 'wallet-outline',
  saving: 'wallet-outline',
  investment: 'trending-up-outline',
  transport: 'car-outline',
};

function budgetIconName(icon?: string | null): keyof typeof Ionicons.glyphMap {
  if (!icon) return 'pricetag-outline';
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return iconAliases[icon] ?? 'pricetag-outline';
}

export default function BudgetForm() {
  const params = useLocalSearchParams<{ id?: string; month?: string; planId?: string }>();
  const isManualEdit = !!params.id;
  const month = params.month ?? currentMonth();
  const colors = useThemeColors();
  const { month: monthNumber, year } = parseMonth(month);

  const [digits, setDigits] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [source, setSource] = useState<BudgetPlanSource>('balance_snapshot');
  const [availableDigits, setAvailableDigits] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<DraftBucket[]>(defaultRows);
  const [error, setError] = useState('');

  const categories = useCategories();
  const budgets = useBudgets(monthNumber, year);
  const plan = useBudgetPlan(monthNumber, year);
  const availableBalance = useBudgetPlanAvailableBalance(monthNumber, year);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget(params.id ?? '');
  const deleteBudget = useDeleteBudget();
  const createPlan = useCreateBudgetPlan();
  const updatePlan = useUpdateBudgetPlan();
  const manualMutation = isManualEdit ? updateBudget : createBudget;
  const planId = params.planId ?? plan.data?.id;
  const planMutation = planId ? updatePlan : createPlan;

  useEffect(() => {
    const b = budgets.data?.find((x) => x.id === params.id);
    if (b) {
      // Query data arrives after the modal mounts; hydrate the editable draft once available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDigits(String(Math.round(b.limit_amount)));
      setCategoryId(b.category_id);
    }
  }, [budgets.data, params.id]);

  useEffect(() => {
    if (!isManualEdit && plan.data) {
      // Query data arrives after the modal mounts; hydrate the editable draft once available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource(plan.data.source ?? 'manual');
      setAvailableDigits(String(Math.round(plan.data.available_amount)));
      setNotes(plan.data.notes ?? '');
      const buckets = plan.data.buckets ?? plan.data.allocations ?? [];
      setRows(
        defaultRows.map((row) => {
          const saved = buckets.find((bucket) => 'bucket_key' in bucket && bucket.bucket_key === row.key);
          return saved ? { ...row, percent: String(saved.percent) } : row;
        }),
      );
    }
  }, [isManualEdit, plan.data]);


  const expenseCategories = (categories.data ?? []).filter((c) => c.type === 'expense');
  const totalPercent = rows.reduce((sum, row) => sum + Number(row.percent || 0), 0);
  const availableAmount =
    source === 'balance_snapshot'
      ? plan.data && plan.data.source === 'balance_snapshot'
        ? plan.data.available_amount
        : (availableBalance.data?.available_balance ?? 0)
      : Number(availableDigits || 0);
  const canSubmitPlan =
    availableAmount > 0 &&
    totalPercent === 100 &&
    !plan.isPending &&
    !availableBalance.isPending &&
    rows.every((r) => Number(r.percent || 0) === 0 || r.name.trim());

  const applyTemplate = (type: 'balanced' | 'saving') => {
    const percents = type === 'balanced' ? ['50', '30', '20'] : ['50', '10', '40'];
    setRows((current) => current.map((row, i) => ({ ...row, percent: percents[i] ?? row.percent })));
  };

  const useSnapshotBalance = () => setSource('balance_snapshot');

  const useManualAmount = () => setSource('manual');

  const updateRow = (key: BudgetPlanBucketKey, patch: Partial<DraftBucket>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const submitManual = () => {
    const amount = Number(digits || 0);
    if (amount <= 0) return setError('Amount must be greater than 0');
    if (!categoryId) return setError('Choose a category');
    setError('');
    manualMutation.mutate(
      { category_id: categoryId, limit_amount: amount, month: monthNumber, year },
      { onSuccess: () => router.back() },
    );
  };

  const submitPlan = () => {
    if (availableAmount <= 0) return setError('Available amount must be greater than 0');
    if (totalPercent !== 100) return setError('Total allocation must equal 100%');
    const buckets: BudgetPlanBucketInput[] = rows.map((row) => ({
      bucket_key: row.key,
      percent: Number(row.percent || 0),
    }));
    setError('');
    const body = {
      month: monthNumber,
      year,
      source,
      available_amount: source === 'manual' ? availableAmount : undefined,
      notes: notes.trim() || null,
      buckets,
    };
    if (planId) {
      updatePlan.mutate({ id: planId, body }, { onSuccess: () => router.back() });
    } else {
      createPlan.mutate(body, { onSuccess: () => router.back() });
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete budget?', 'This category budget will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteBudget.mutate(params.id!, { onSuccess: () => router.back() }),
      },
    ]);

  if (isManualEdit) {
    return (
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">Edit manual budget</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close budget form"
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="close" size={26} color={colors.muted} />
          </Pressable>
        </View>
        <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
          <View className="items-center gap-1 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Monthly budget</Text>
            <TextInput
              accessibilityLabel="Manual monthly budget"
              className="font-extrabold tabular-nums text-5xl text-ink dark:text-ink-dark"
              keyboardType="number-pad"
              placeholder="Rp0"
              placeholderTextColor={colors.muted}
              value={digits ? formatCurrency(Number(digits)) : ''}
              onChangeText={(v) => setDigits(digitsOnly(v))}
              maxLength={17}
            />
          </View>
          <CategoryPicker categories={expenseCategories} value={categoryId} onChange={setCategoryId} />
          {error ? <Text className="text-sm text-error dark:text-error-dark">{error}</Text> : null}
          {manualMutation.error ? (
            <Text className="text-sm text-error dark:text-error-dark">{manualMutation.error.message}</Text>
          ) : null}
          <Button title="Save changes" loading={manualMutation.isPending} onPress={submitManual} />
          <Button title="Delete budget" variant="quiet" loading={deleteBudget.isPending} onPress={confirmDelete} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="flex-row items-center justify-between px-5 py-4">
        <View>
          <Text className="font-bold text-xl text-ink dark:text-ink-dark">Budget Planner</Text>
          <Text className="text-sm text-muted dark:text-muted-dark">{monthLabel(month)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close budget form"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="close" size={26} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-4 border-y border-line py-5 dark:border-line-dark">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary-dark/15">
              <Ionicons name="wallet-outline" size={22} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-base text-ink dark:text-ink-dark">Budget source</Text>
              <Text className="text-xs text-muted dark:text-muted-dark">Balance snapshot or a manual amount</Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            <SourceButton active={source === 'balance_snapshot'} title="Available balance" onPress={useSnapshotBalance} />
            <SourceButton active={source === 'manual'} title="Manual" onPress={useManualAmount} />
          </View>

          {source === 'balance_snapshot' ? (
            <View className="rounded-xl bg-bg p-4 dark:bg-bg-dark">
              <Text className="text-xs text-muted dark:text-muted-dark">Available now</Text>
              <Text className="mt-1 font-extrabold tabular-nums text-3xl text-ink dark:text-ink-dark">
                {availableBalance.data ? formatCurrency(availableBalance.data.available_balance) : 'Loading…'}
              </Text>
              <Text className="mt-2 text-xs text-muted dark:text-muted-dark">
                New income does not change the plan automatically. Refresh it when needed.
              </Text>
            </View>
          ) : (
            <View>
              <Text className="mb-2 font-medium text-sm text-muted dark:text-muted-dark">Amount this month</Text>
              <TextInput
                accessibilityLabel="Amount this month"
                className="min-h-16 rounded-xl bg-bg px-4 font-extrabold tabular-nums text-4xl text-ink dark:bg-bg-dark dark:text-ink-dark"
                keyboardType="number-pad"
                placeholder="Rp0"
                placeholderTextColor={colors.muted}
                value={availableDigits ? formatCurrency(availableAmount) : ''}
                onChangeText={(v) => setAvailableDigits(digitsOnly(v))}
                maxLength={17}
              />
            </View>
          )}

          <View>
            <Text className="mb-2 font-medium text-sm text-muted dark:text-muted-dark">Notes</Text>
            <TextInput
              accessibilityLabel="Budget notes"
              className="min-h-12 rounded-xl bg-bg px-4 py-3 text-base text-ink dark:bg-bg-dark dark:text-ink-dark"
              placeholder="For example, salary after repayments"
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-semibold text-base text-ink dark:text-ink-dark">Quick template</Text>
            <Text className="text-xs text-muted dark:text-muted-dark">Target total: 100%</Text>
          </View>
          <View className="flex-row gap-2">
          <TemplateButton title="50/30/20" onPress={() => applyTemplate('balanced')} />
          <TemplateButton title="50/10/40" onPress={() => applyTemplate('saving')} />
          <View className="ml-auto rounded-2xl bg-card px-3 py-2 dark:bg-card-dark">
            <Text
              className={`font-bold tabular-nums text-sm ${totalPercent === 100 ? 'text-secondary dark:text-secondary-dark' : 'text-error dark:text-error-dark'}`}
            >
              {totalPercent}%
            </Text>
          </View>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-base text-ink dark:text-ink-dark">Allocation</Text>
            <Text className="text-xs text-muted dark:text-muted-dark">Automatic categories</Text>
          </View>
          {rows.map((row) => {
            const percent = Number(row.percent || 0);
            const planned = availableAmount > 0 ? Math.round((availableAmount * percent) / 100) : 0;
            return (
              <View key={row.key} className="border-b border-line py-4 dark:border-line-dark">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${row.color}22` }}>
                    <Ionicons name={budgetIconName(row.icon)} size={22} color={row.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-base text-ink dark:text-ink-dark">{row.name}</Text>
                    <Text className="tabular-nums text-xs text-muted dark:text-muted-dark">{formatCurrency(planned)}</Text>
                  </View>
                  <TextInput
                    accessibilityLabel={`${row.name} percentage`}
                    className="h-11 w-16 rounded-xl bg-bg px-3 text-center font-bold tabular-nums text-ink dark:bg-bg-dark dark:text-ink-dark"
                    keyboardType="number-pad"
                    value={row.percent}
                    onChangeText={(v) => updateRow(row.key, { percent: digitsOnly(v).slice(0, 3) })}
                  />
                </View>
                <Text className="mt-3 text-xs text-muted dark:text-muted-dark">{row.description}</Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {row.categories.map((category) => (
                    <View key={category} className="rounded-md bg-bg px-3 py-1.5 dark:bg-bg-dark">
                      <Text className="text-xs text-muted dark:text-muted-dark">{category}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {error ? <Text className="text-sm text-error dark:text-error-dark">{error}</Text> : null}
        {planMutation.error ? (
          <Text className="text-sm text-error dark:text-error-dark">{planMutation.error.message}</Text>
        ) : null}
        <Button
          title={plan.data ? 'Save budget plan' : 'Create budget plan'}
          loading={planMutation.isPending}
          onPress={submitPlan}
          disabled={!canSubmitPlan || planMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SourceButton({ active, title, onPress }: { active: boolean; title: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`min-h-12 flex-1 items-center rounded-xl px-3 py-3 ${active ? 'bg-primary dark:bg-primary-dark' : 'bg-bg dark:bg-bg-dark'}`}
    >
      <Text className={`font-semibold text-sm ${active ? 'text-white' : 'text-ink dark:text-ink-dark'}`}>{title}</Text>
    </Pressable>
  );
}

function TemplateButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Use ${title} template`}
      onPress={onPress}
      className="rounded-xl border border-line bg-card px-3 py-2 dark:border-line-dark dark:bg-card-dark"
    >
      <Text className="font-semibold text-sm text-ink dark:text-ink-dark">{title}</Text>
    </Pressable>
  );
}

function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: ReturnType<typeof useCategories>['data'];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-medium text-sm text-ink dark:text-ink-dark">Category</Text>
      <View className="flex-row flex-wrap gap-3">
        {(categories ?? []).map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${c.name} category`}
            accessibilityState={{ selected: value === c.id }}
            onPress={() => onChange(c.id)}
            className={`min-h-16 w-[22%] items-center gap-1.5 rounded-xl border-2 py-3 ${
              value === c.id
                ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/10'
                : 'border-transparent'
            }`}
          >
            <CategoryIcon category={c} size={40} />
            <Text numberOfLines={1} className="text-center text-[11px] text-muted dark:text-muted-dark">
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
