import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'fintrack.token';
const REFRESH_TOKEN_KEY = 'fintrack.refreshToken';
const ONBOARDED_KEY = 'fintrack.onboarded';

export const storage = {
  getTokens: async () => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    return { accessToken, refreshToken };
  },
  setTokens: (accessToken: string, refreshToken: string) =>
    Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]),
  clearTokens: () =>
    Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]),
  isOnboarded: async () => (await SecureStore.getItemAsync(ONBOARDED_KEY)) === '1',
  setOnboarded: () => SecureStore.setItemAsync(ONBOARDED_KEY, '1'),
};
