import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'fintrack.token';
const ONBOARDED_KEY = 'fintrack.onboarded';

export const storage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
  isOnboarded: async () => (await SecureStore.getItemAsync(ONBOARDED_KEY)) === '1',
  setOnboarded: () => SecureStore.setItemAsync(ONBOARDED_KEY, '1'),
};
