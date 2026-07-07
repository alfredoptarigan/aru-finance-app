import { useMutation, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { qk, queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth';
import type { AuthUser, AvatarUploadResponse, Me, Session } from '@/types';

interface AuthPayload {
  user: AuthUser;
  session: Session;
}

export function useMe() {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<Me>('/me'),
    enabled: status === 'authed',
  });
}

export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthPayload>('/auth/login', body),
    onSuccess: async ({ session }) => {
      await signIn(session);
    },
  });
}

export function useRegister() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: (body: { email: string; password: string; full_name: string }) =>
      api.post<AuthPayload>('/auth/register', body),
    onSuccess: async ({ session }) => {
      await signIn(session);
    },
  });
}


export function useUploadAvatar() {
  return useMutation({
    mutationFn: (formData: FormData) => api.uploadAvatar(formData),
    onSuccess: ({ profile }: AvatarUploadResponse) => {
      queryClient.setQueryData<Me>(qk.me, (old) => (old ? { ...old, profile } : old));
    },
  });
}

export function useLogout() {
  const signOut = useAuthStore((s) => s.signOut);
  // ponytail: POST /auth/logout only clears the web cookie session and doesn't
  // accept a Bearer token per the API docs — mobile just drops the local token.
  return useMutation({
    mutationFn: () => Promise.resolve(),
    onSettled: () => signOut(),
  });
}
