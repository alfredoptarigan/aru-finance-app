import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type { Goal, GoalStatus } from '@/types';

export function useGoals() {
  return useQuery({ queryKey: qk.goals, queryFn: () => api.get<Goal[]>('/goals') });
}

export interface GoalInput {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  status?: GoalStatus;
}

const invalidate = () => void queryClient.invalidateQueries({ queryKey: qk.goals });

export function useCreateGoal() {
  return useMutation({
    mutationFn: (body: GoalInput) => api.post<Goal>('/goals', body),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal(id: string) {
  return useMutation({
    mutationFn: (body: Partial<GoalInput>) => api.put<Goal>(`/goals/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: invalidate,
  });
}

export function useContributeGoal(id: string) {
  return useMutation({
    mutationFn: (amount: number) => api.post<Goal>(`/goals/${id}/contribute`, { amount }),
    onSuccess: invalidate,
  });
}
