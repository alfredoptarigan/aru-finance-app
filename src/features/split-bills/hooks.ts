import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type { Paginated, SplitBill, SplitBillBreakdown, SplitBillData, SplitBillScan } from '@/types';

export interface SplitBillInput {
  merchant_name: string;
  bill_date: string;
  currency: 'IDR';
  receipt_total: number;
  data: SplitBillData;
}

function invalidateSplitBills() {
  void queryClient.invalidateQueries({ queryKey: qk.splitBills });
}

export function useSplitBills(page: number, limit = 20) {
  return useQuery({
    queryKey: qk.splitBillList(page),
    queryFn: () => api.get<Paginated<SplitBill>>(`/split-bills?page=${page}&limit=${limit}`),
  });
}

export function useSplitBill(id: string) {
  return useQuery({
    queryKey: qk.splitBillDetail(id),
    queryFn: () => api.get<{ bill: SplitBill; breakdown: SplitBillBreakdown }>(`/split-bills/${id}`),
    enabled: !!id,
  });
}

export function useCreateSplitBill() {
  return useMutation({
    mutationFn: (body: SplitBillInput) => api.post<SplitBill>('/split-bills', body),
    onSuccess: invalidateSplitBills,
  });
}

export function useUpdateSplitBill(id: string) {
  return useMutation({
    mutationFn: (body: Partial<SplitBillInput>) => api.put<SplitBill>(`/split-bills/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.splitBillDetail(id) });
      invalidateSplitBills();
    },
  });
}

export function useFinalizeSplitBill(id: string) {
  return useMutation({
    mutationFn: () => api.post<SplitBill>(`/split-bills/${id}/finalize`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.splitBillDetail(id) });
      invalidateSplitBills();
    },
  });
}

export function useSetSplitBillPaid(id: string) {
  return useMutation({
    mutationFn: (body: { participant_id: string; is_paid: boolean }) =>
      api.patch<SplitBill>(`/split-bills/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.splitBillDetail(id) });
      invalidateSplitBills();
    },
  });
}

export function useDeleteSplitBill() {
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/split-bills/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: qk.splitBillDetail(id) });
      invalidateSplitBills();
    },
  });
}

export function useScanSplitBill() {
  return useMutation({
    mutationFn: (body: { file: string; media_type: string }) => api.post<SplitBillScan>('/split-bills/scan', body),
  });
}
