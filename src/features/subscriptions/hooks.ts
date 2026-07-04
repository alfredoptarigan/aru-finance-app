import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';
import type { Subscription, SubscriptionBillingCycle } from '@/types';

export interface SubscriptionInput {
  name: string;
  description?: string;
  amount: number;
  billing_cycle: SubscriptionBillingCycle;
  next_billing_date: string;
  category: string;
  payment_method?: string | null;
  auto_debit: boolean;
  is_active: boolean;
}

export const subscriptionsKey = ['subscriptions'] as const;

const now = new Date().toISOString();

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-netflix',
    user_id: 'mock-user',
    name: 'Netflix',
    description: 'Family plan',
    amount: 46500,
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-25',
    category: 'Entertainment',
    icon: 'play-circle',
    color: '#EF4444',
    payment_method: 'Rekening gaji',
    auto_debit: true,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sub-supabase',
    user_id: 'mock-user',
    name: 'Supabase',
    description: 'Other',
    amount: 570000,
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-26',
    category: 'Work tools',
    icon: 'server',
    color: '#22C55E',
    payment_method: 'Rekening gaji',
    auto_debit: true,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sub-insurance',
    user_id: 'mock-user',
    name: 'Asuransi chubb',
    description: 'Protection',
    amount: 340000,
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-27',
    category: 'Insurance',
    icon: 'shield-checkmark',
    color: '#64748B',
    payment_method: 'Rekening gaji',
    auto_debit: true,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'sub-youtube',
    user_id: 'mock-user',
    name: 'YouTube Premium',
    description: 'Personal plan',
    amount: 80000,
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-05',
    category: 'Entertainment',
    icon: 'logo-youtube',
    color: '#EF4444',
    payment_method: 'E-wallet',
    auto_debit: true,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
];

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionsKey,
    queryFn: async () => mockSubscriptions,
    staleTime: Infinity,
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: async (body: SubscriptionInput): Promise<Subscription> => {
      const createdAt = new Date().toISOString();
      return {
        ...body,
        id: `sub-${Date.now()}`,
        user_id: 'mock-user',
        icon: 'card',
        color: '#6366F1',
        created_at: createdAt,
        updated_at: createdAt,
      };
    },
    onSuccess: (created) => {
      queryClient.setQueryData<Subscription[]>(subscriptionsKey, (old = mockSubscriptions) => [
        created,
        ...old,
      ]);
    },
  });
}
