import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRegister } from '@/features/auth/hooks';

const schema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const register = useRegister();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(({ confirm: _confirm, ...values }) =>
    register.mutate(values, { onSuccess: () => router.replace('/') }),
  );

  return (
    <AuthScaffold
      title="Start a calmer ledger."
      subtitle="Create an account and put every rupiah in its place."
      footerQuestion="Already have an account?"
      footerAction="Sign in"
      footerHref="/(auth)/login"
    >
      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Name"
            icon="person-outline"
            placeholder="Your name"
            value={value}
            onChangeText={onChange}
            error={errors.full_name?.message}
          />
        )}
      />
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
            placeholder="At least 6 characters"
            secure
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirm"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Confirm password"
            icon="lock-closed-outline"
            placeholder="Repeat password"
            secure
            value={value}
            onChangeText={onChange}
            error={errors.confirm?.message}
          />
        )}
      />

      {register.error ? (
        <Text className="text-sm text-error dark:text-error-dark">{register.error.message}</Text>
      ) : null}

      <Button title="Create account" loading={register.isPending} onPress={onSubmit} />
    </AuthScaffold>
  );
}
