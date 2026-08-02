import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLogin } from '@/features/auth/hooks';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const login = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => router.replace('/') }),
  );

  return (
    <AuthScaffold
      title="Your money, in clear view."
      subtitle="Welcome back. Sign in to continue your ledger."
      footerQuestion="New to Ledgeria?"
      footerAction="Create an account"
      footerHref="/(auth)/register"
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secure
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      <Link href="/(auth)/forgot-password" asChild>
        <Text className="self-end font-medium text-sm text-primary dark:text-primary-dark">Forgot password?</Text>
      </Link>

      {login.error ? (
        <Text className="text-sm text-error dark:text-error-dark">{login.error.message}</Text>
      ) : null}

      <Button title="Sign in" loading={login.isPending} onPress={onSubmit} />
    </AuthScaffold>
  );
}
