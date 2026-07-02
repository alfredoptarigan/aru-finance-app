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
  description?: string | null;
  transaction_date: string; // 'YYYY-MM-DD'
  payment_method_id?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  payment_method?: PaymentMethod;
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
