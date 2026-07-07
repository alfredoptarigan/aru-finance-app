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
    full_name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Password tidak sama',
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
      title="Buat akun dan mulai atur uangmu."
      subtitle="Mulai kelola keuanganmu hari ini"
      footerQuestion="Sudah punya akun?"
      footerAction="Masuk"
      footerHref="/(auth)/login"
    >
      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nama"
            icon="person-outline"
            placeholder="Nama kamu"
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
            placeholder="kamu@email.com"
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
            placeholder="Minimal 6 karakter"
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
            label="Konfirmasi Password"
            icon="lock-closed-outline"
            placeholder="Ulangi password"
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

      <Button title="Daftar" variant="gradient" loading={register.isPending} onPress={onSubmit} />
    </AuthScaffold>
  );
}
