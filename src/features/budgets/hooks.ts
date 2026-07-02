import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type { Budget } from '@/types';

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

const invalidate = () => {
  void queryClient.invalidateQueries({ queryKey: ['budgets'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
};

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
