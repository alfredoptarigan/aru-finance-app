import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export const qk = {
  me: ['me'] as const,
  summary: ['dashboard', 'summary'] as const,
  todaySummary: ['dashboard', 'today-summary'] as const,
  charts: ['dashboard', 'charts'] as const,
  insights: ['insights'] as const,
  transactions: ['transactions'] as const,
  transactionList: (filters: Record<string, string | undefined>) =>
    ['transactions', 'list', filters] as const,
  transaction: (id: string) => ['transactions', 'detail', id] as const,
  categories: ['categories'] as const,
  paymentMethods: ['payment-methods'] as const,
  budgets: (month: number, year: number) => ['budgets', year, month] as const,
  budgetPlan: (month: number, year: number) => ['budget-plans', year, month] as const,
  budgetPlanAvailableBalance: (month: number, year: number) =>
    ['budget-plans', 'available-balance', year, month] as const,
  budgetPlanTemplates: ['budget-plans', 'templates'] as const,
  goals: ['goals'] as const,
};
