import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { UpcomingBill, UpcomingBillsSummary } from '@/types';

function rangeParams(startDate: string, endDate: string) {
  return new URLSearchParams({ start_date: startDate, end_date: endDate }).toString();
}

export function useUpcomingBills(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['upcoming-bills', startDate, endDate],
    queryFn: () => api.get<UpcomingBill[]>(`/upcoming-bills?${rangeParams(startDate, endDate)}`),
  });
}

export function useUpcomingBillsSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['upcoming-bills', 'summary', startDate, endDate],
    queryFn: () =>
      api.get<UpcomingBillsSummary>(`/upcoming-bills/summary?${rangeParams(startDate, endDate)}`),
  });
}
