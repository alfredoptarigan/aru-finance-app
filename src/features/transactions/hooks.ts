import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type { Category, Paginated, PaymentMethod, Transaction } from '@/types';

export interface TransactionFilters {
  search?: string;
  type?: 'income' | 'expense';
  category_id?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'transaction_date' | 'title' | 'amount' | 'type';
  sort_order?: 'asc' | 'desc';
}

const PAGE_SIZE = 20;

function listPath(filters: TransactionFilters, page: number) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return `/transactions?${params.toString()}`;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: qk.transactionList(filters as Record<string, string | undefined>),
    queryFn: ({ pageParam }) => api.get<Paginated<Transaction>>(listPath(filters, pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: qk.transaction(id),
    queryFn: () => api.get<Transaction>(`/transactions/${id}`),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: () => api.get<Category[]>('/categories'),
    staleTime: 5 * 60_000,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: qk.paymentMethods,
    queryFn: () => api.get<PaymentMethod[]>('/payment-methods'),
    staleTime: 5 * 60_000,
  });
}

export interface TransactionInput {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  description?: string;
  category_id: string;
  transaction_date: string;
  payment_method_id?: string | null;
}

function invalidateMoneyData() {
  void queryClient.invalidateQueries({ queryKey: qk.transactions });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  void queryClient.invalidateQueries({ queryKey: ['budgets'] });
  void queryClient.invalidateQueries({ queryKey: qk.insights });
}

export function useCreateTransaction() {
  return useMutation({
    mutationFn: (body: TransactionInput) => api.post<Transaction>('/transactions', body),
    onSuccess: invalidateMoneyData,
  });
}

export function useUpdateTransaction(id: string) {
  return useMutation({
    mutationFn: (body: Partial<TransactionInput>) =>
      api.put<Transaction>(`/transactions/${id}`, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.transaction(id), updated);
      invalidateMoneyData();
    },
  });
}

// Optimistic delete: remove from every cached list immediately, roll back on error.
export function useDeleteTransaction() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.transactions });
      const previous = queryClient.getQueriesData({ queryKey: qk.transactions });
      queryClient.setQueriesData(
        { queryKey: [...qk.transactions, 'list'] },
        (old: { pages: Paginated<Transaction>[] } | undefined) =>
          old && {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              items: p.items.filter((t) => t.id !== id),
            })),
          },
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidateMoneyData,
  });
}
