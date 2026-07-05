import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import type { Subscription, SubscriptionBillingCycle } from '@/types';

export interface SubscriptionInput {
  name: string;
  description?: string;
  amount: number;
  billing_cycle: SubscriptionBillingCycle;
  next_billing_date: string;
  category: string;
  icon?: string;
  color?: string;
  payment_method_id?: string | null;
  auto_debit: boolean;
  is_active: boolean;
  reminder_days_before?: number[];
  auto_create_transaction?: boolean;
}

export const subscriptionsKey = ['subscriptions'] as const;
export const subscriptionSummaryKey = ['subscriptions', 'summary'] as const;

function invalidateSubscriptions() {
  void queryClient.invalidateQueries({ queryKey: subscriptionsKey });
  void queryClient.invalidateQueries({ queryKey: subscriptionSummaryKey });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  void queryClient.invalidateQueries({ queryKey: ['insights'] });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionsKey,
    queryFn: () => api.get<Subscription[]>('/subscriptions'),
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: (body: SubscriptionInput) => api.post<Subscription>('/subscriptions', body),
    onSuccess: invalidateSubscriptions,
  });
}

export function useUpdateSubscription(id: string) {
  return useMutation({
    mutationFn: (body: Partial<SubscriptionInput>) => api.put<Subscription>(`/subscriptions/${id}`, body),
    onSuccess: invalidateSubscriptions,
  });
}

export function useDeleteSubscription() {
  return useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: invalidateSubscriptions,
  });
}
