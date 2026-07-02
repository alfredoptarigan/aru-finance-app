import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { gradients } from '@/constants/colors';
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-bg dark:bg-bg-dark"
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 90, paddingBottom: 56, paddingHorizontal: 28 }}
        >
          <Text className="font-extrabold text-4xl text-white">FinTrack</Text>
          <Text className="mt-2 text-base text-white/80">Selamat datang kembali 👋</Text>
        </LinearGradient>

        <Card className="-mt-7 mx-5 gap-4 p-5">
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

          <Link href="/(auth)/forgot-password" asChild>
            <Text className="self-end font-medium text-sm text-primary dark:text-primary-dark">
              Lupa password?
            </Text>
          </Link>

          {login.error ? (
            <Text className="text-sm text-error dark:text-error-dark">{login.error.message}</Text>
          ) : null}

          <Button title="Masuk" variant="gradient" loading={login.isPending} onPress={onSubmit} />
        </Card>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-sm text-muted dark:text-muted-dark">Belum punya akun?</Text>
          <Link href="/(auth)/register" asChild>
            <Text className="font-semibold text-sm text-primary dark:text-primary-dark">
              Daftar sekarang
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
