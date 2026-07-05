export type TransactionType = 'income' | 'expense';

export type PaymentMethodType =
  | 'cash'
  | 'bank_transfer'
  | 'debit_card'
  | 'credit_card'
  | 'e_wallet'
  | 'qris'
  | 'other';

export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type SubscriptionBillingCycle = 'weekly' | 'monthly' | 'yearly';
export type UpcomingBillSource = 'subscription';
export type UpcomingBillStatus = 'overdue' | 'due_today' | 'upcoming';
export type BudgetPlanStatus = 'draft' | 'active' | 'closed';
export type BudgetPlanSource = 'manual' | 'balance_snapshot';
export type BudgetAllocationKind = 'expense' | 'saving' | 'investment';
export type BudgetPlanBucketKey = 'operational' | 'fun' | 'investing';
export type BudgetAllocationStatus = 'safe' | 'warning' | 'exhausted' | 'overbudget';
export type SummaryItemKind = 'bill' | 'budget' | 'goal' | 'cashflow';
export type SummaryItemSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface AuthUser {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Me {
  user: AuthUser;
  profile: Profile;
}


export interface AvatarUploadResponse {
  profile: Profile;
  avatar_path: string;
  avatar_url: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  type: PaymentMethodType;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  title: string;
  description: string | null;
  transaction_date: string; // 'YYYY-MM-DD'
  payment_method_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  payment_method?: PaymentMethod;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  amount: number;
  billing_cycle: SubscriptionBillingCycle;
  next_billing_date: string; // 'YYYY-MM-DD'
  category: string;
  icon: string;
  color: string;
  payment_method_id: string | null;
  payment_method: string | null;
  auto_debit: boolean;
  is_active: boolean;
  reminder_days_before: number[];
  auto_create_transaction: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpcomingBill {
  id: string;
  source: UpcomingBillSource;
  source_id: string;
  name: string;
  amount: number;
  due_date: string; // 'YYYY-MM-DD'
  status: UpcomingBillStatus;
  category: string;
  icon: string;
  color: string;
  auto_debit: boolean;
  payment_method: string | null;
}

export interface UpcomingBillsSummary {
  total_amount: number;
  bill_count: number;
  due_today_count: number;
  overdue_count: number;
  auto_debit_total: number;
  manual_payment_total: number;
  nearest_due: UpcomingBill | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent_amount: number;
  usage_percent: number;
}


export interface BudgetPlan {
  id: string;
  user_id: string;
  month: number;
  year: number;
  source: BudgetPlanSource;
  available_amount: number;
  balance_snapshot_amount: number | null;
  balance_snapshot_at: string | null;
  allocated_amount: number;
  unallocated_amount: number;
  total_percent: number;
  status: BudgetPlanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buckets?: BudgetPlanBucket[];
  allocations?: BudgetPlanAllocation[];
  summary: BudgetPlanSummary;
}


export interface BudgetPlanAvailableBalance {
  month: number;
  year: number;
  available_balance: number;
  income_month_to_date: number;
  expense_month_to_date: number;
  unpaid_committed_amount: number;
  calculated_at: string;
}

export interface BudgetPlanBucket {
  id: string;
  plan_id: string;
  bucket_key: BudgetPlanBucketKey;
  name: string;
  icon: string;
  color: string;
  percent: number;
  planned_amount: number;
  actual_amount: number;
  remaining_amount: number;
  usage_percent: number;
  status: BudgetAllocationStatus;
  category_ids: string[];
  category_names: string[];
  created_at: string;
  updated_at: string;
}

export interface BudgetPlanAllocation {
  id: string;
  plan_id: string;
  category_id: string | null;
  goal_id: string | null;
  kind: BudgetAllocationKind;
  name: string;
  icon: string;
  color: string;
  percent: number;
  planned_amount: number;
  actual_amount: number;
  remaining_amount: number;
  usage_percent: number;
  status: BudgetAllocationStatus;
  budget_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetPlanSummary {
  spent_amount: number;
  invested_amount: number;
  remaining_amount: number;
  overbudget_amount: number;
  warning_count: number;
  exhausted_count: number;
  overbudget_count: number;
  daily_safe_to_spend: number;
  days_left_in_month: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  progress_percent: number;
  remaining_amount: number;
  monthly_savings_estimate: number | null;
}

export interface DashboardSummary {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  budgetAlerts: unknown[];
  recentTransactions: Transaction[];
  month: number;
  year: number;
}

export interface TodaySummary {
  date: string;
  week_start: string;
  week_end: string;
  month: number;
  year: number;
  cashflow: CashflowSnapshot;
  bills: BillsSnapshot;
  budgets: BudgetSnapshot[];
  goals: GoalSnapshot[];
  items: SummaryItem[];
}

export interface CashflowSnapshot {
  income_month_to_date: number;
  expense_month_to_date: number;
  balance_month_to_date: number;
  savings_rate: number;
}

export interface BillsSnapshot {
  due_today_count: number;
  due_this_week_count: number;
  due_this_week_total: number;
  nearest_due: SummaryBill | null;
}

export interface SummaryBill {
  id: string;
  source: UpcomingBillSource;
  source_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: UpcomingBillStatus;
  auto_debit: boolean;
  payment_method: string | null;
}

export interface BudgetSnapshot {
  id: string;
  category_id: string;
  category_name: string;
  icon: string;
  color: string;
  limit_amount: number;
  spent_amount: number;
  usage_percent: number;
  remaining_amount: number;
}

export interface GoalSnapshot {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  remaining_amount: number;
  deadline: string | null;
}

export interface SummaryItem {
  id: string;
  kind: SummaryItemKind;
  severity: SummaryItemSeverity;
  title: string;
  subtitle: string;
  amount: number | null;
  route: string | null;
}

export interface MonthlyTrendPoint {
  label: string;
  income: number;
  expense: number;
}

export interface CategoryTotal {
  category_id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
}

export interface ChartData {
  monthlyTrend: MonthlyTrendPoint[];
  expenseByCategory: CategoryTotal[];
  incomeByCategory: CategoryTotal[];
}

export interface InsightsData {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  incomeChange: number;
  expenseChange: number;
  avgDailyExpense: number;
  topCategory: { name: string; total: number } | null;
  categoryBreakdown: CategoryTotal[];
  activeGoals: number;
  goalProgress: number;
  monthlyRecurringExpense: number;
  transactionCount: number;
  month: number;
  year: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
