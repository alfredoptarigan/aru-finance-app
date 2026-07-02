import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk } from '@/lib/query-client';
import type { ChartData, DashboardSummary, InsightsData } from '@/types';

export function useSummary() {
  return useQuery({
    queryKey: qk.summary,
    queryFn: () => api.get<DashboardSummary>('/dashboard/summary'),
  });
}

export function useCharts() {
  return useQuery({
    queryKey: qk.charts,
    queryFn: () => api.get<ChartData>('/dashboard/charts'),
  });
}

export function useInsights() {
  return useQuery({
    queryKey: qk.insights,
    queryFn: () => api.get<InsightsData>('/insights'),
  });
}
