import { create } from 'zustand';

import { setAuthToken, setOnUnauthorized } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { storage } from '@/lib/storage';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  status: AuthStatus;
  onboarded: boolean;
  hydrate: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  onboarded: false,

  hydrate: async () => {
    const [token, onboarded] = await Promise.all([storage.getToken(), storage.isOnboarded()]);
    setAuthToken(token);
    setOnUnauthorized(() => {
      void useAuthStore.getState().signOut();
    });
    set({ status: token ? 'authed' : 'guest', onboarded });
  },

  signIn: async (token) => {
    await storage.setToken(token);
    setAuthToken(token);
    set({ status: 'authed' });
  },

  signOut: async () => {
    await storage.clearToken();
    setAuthToken(null);
    queryClient.clear();
    set({ status: 'guest' });
  },

  completeOnboarding: async () => {
    await storage.setOnboarded();
    set({ onboarded: true });
  },
}));
