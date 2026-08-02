import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import type { PaymentMethodType, Wallet } from '@/types';

export interface WalletInput {
  name: string;
  type: PaymentMethodType;
  account_number?: string | null;
  balance: number;
}

function invalidateWallets() {
  void queryClient.invalidateQueries({ queryKey: qk.wallets });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useWallets() {
  return useQuery({
    queryKey: qk.wallets,
    queryFn: () => api.get<Wallet[]>('/payment-methods'),
    staleTime: 60_000,
  });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: qk.wallet(id),
    queryFn: () => api.get<Wallet>(`/payment-methods/${id}`),
    enabled: !!id,
  });
}

export function useCreateWallet() {
  return useMutation({
    mutationFn: (body: WalletInput) => api.post<Wallet>('/payment-methods', body),
    onSuccess: invalidateWallets,
  });
}

export function useUpdateWallet(id: string) {
  return useMutation({
    mutationFn: (body: Partial<WalletInput>) => api.put<Wallet>(`/payment-methods/${id}`, body),
    onSuccess: (wallet) => {
      queryClient.setQueryData(qk.wallet(id), wallet);
      invalidateWallets();
    },
  });
}

export function useDeleteWallet() {
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/payment-methods/${id}`),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: qk.wallet(id) });
      invalidateWallets();
    },
  });
}
