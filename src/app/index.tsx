import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const onboarded = useAuthStore((s) => s.onboarded);

  if (status === 'loading') return null;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (status === 'guest') return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
