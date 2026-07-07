import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLogin } from '@/features/auth/hooks';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
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
      title="Kelola keuanganmu lebih mudah."
      subtitle="Selamat datang kembali"
      footerQuestion="Belum punya akun?"
      footerAction="Daftar sekarang"
      footerHref="/(auth)/register"
    >
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
            placeholder="••••••••"
            secure
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
          />
        )}
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded bg-primary">
            <Ionicons name="checkmark" size={15} color="white" />
          </View>
          <Text className="text-sm text-ink dark:text-ink-dark">Ingat saya</Text>
        </View>
        <Link href="/(auth)/forgot-password" asChild>
          <Text className="font-medium text-sm text-primary dark:text-primary-dark">Lupa password?</Text>
        </Link>
      </View>

      {login.error ? (
        <Text className="text-sm text-error dark:text-error-dark">{login.error.message}</Text>
      ) : null}

      <Button title="Masuk" variant="gradient" loading={login.isPending} onPress={onSubmit} />
    </AuthScaffold>
  );
}
