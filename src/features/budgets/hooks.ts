import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type {
  Budget,
  BudgetPlan,
  BudgetPlanBucketKey,
  BudgetPlanAvailableBalance,
  BudgetPlanSource,
} from '@/types';

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: qk.budgets(month, year),
    queryFn: () => api.get<Budget[]>(`/budgets?month=${month}&year=${year}`),
  });
}

export interface BudgetInput {
  category_id: string;
  month: number;
  year: number;
  limit_amount: number;
}

export interface BudgetPlanBucketInput {
  bucket_key: BudgetPlanBucketKey;
  percent: number;
}

export interface BudgetPlanInput {
  month: number;
  year: number;
  source?: BudgetPlanSource;
  available_amount?: number;
  notes?: string | null;
  buckets: BudgetPlanBucketInput[];
}

const invalidate = () => {
  void queryClient.invalidateQueries({ queryKey: ['budgets'] });
  void queryClient.invalidateQueries({ queryKey: ['budget-plans'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};


export function useBudgetPlan(month: number, year: number) {
  return useQuery({
    queryKey: qk.budgetPlan(month, year),
    queryFn: () => api.get<BudgetPlan>(`/budget-plans?month=${month}&year=${year}`),
    retry: false,
  });
}

export function useBudgetPlanAvailableBalance(month: number, year: number) {
  return useQuery({
    queryKey: qk.budgetPlanAvailableBalance(month, year),
    queryFn: () =>
      api.get<BudgetPlanAvailableBalance>(`/budget-plans/available-balance?month=${month}&year=${year}`),
  });
}

export function useCreateBudgetPlan() {
  return useMutation({
    mutationFn: (body: BudgetPlanInput) => api.post<BudgetPlan>('/budget-plans', body),
    onSuccess: invalidate,
  });
}

export function useUpdateBudgetPlan() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: BudgetPlanInput }) =>
      api.put<BudgetPlan>(`/budget-plans/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useRefreshBudgetPlanBalance() {
  return useMutation({
    mutationFn: (id: string) => api.post<BudgetPlan>(`/budget-plans/${id}/refresh-balance`),
    onSuccess: invalidate,
  });
}

export function useDeleteBudgetPlan() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budget-plans/${id}`),
    onSuccess: invalidate,
  });
}

// POST upserts (one budget per category/month/year)
export function useCreateBudget() {
  return useMutation({
    mutationFn: (body: BudgetInput) => api.post<Budget>('/budgets', body),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget(id: string) {
  return useMutation({
    mutationFn: (body: Partial<BudgetInput>) => api.put<Budget>(`/budgets/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: invalidate,
  });
}
