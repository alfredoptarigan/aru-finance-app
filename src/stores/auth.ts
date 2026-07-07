import { create } from 'zustand';

import { setAuthTokens, setOnSessionRefreshed, setOnUnauthorized } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { storage } from '@/lib/storage';
import type { Session } from '@/types';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  status: AuthStatus;
  onboarded: boolean;
  hydrate: () => Promise<void>;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  onboarded: false,

  hydrate: async () => {
    const [{ accessToken, refreshToken }, onboarded] = await Promise.all([
      storage.getTokens(),
      storage.isOnboarded(),
    ]);
    setAuthTokens(accessToken, refreshToken);
    setOnSessionRefreshed((session) =>
      storage.setTokens(session.access_token, session.refresh_token).then(() => undefined),
    );
    setOnUnauthorized(() => {
      void useAuthStore.getState().signOut();
    });
    set({ status: accessToken ? 'authed' : 'guest', onboarded });
  },

  signIn: async (session) => {
    await storage.setTokens(session.access_token, session.refresh_token);
    setAuthTokens(session.access_token, session.refresh_token);
    set({ status: 'authed' });
  },

  signOut: async () => {
    await storage.clearTokens();
    setAuthTokens(null, null);
    queryClient.clear();
    set({ status: 'guest' });
  },

  completeOnboarding: async () => {
    await storage.setOnboarded();
    set({ onboarded: true });
  },
}));
