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
          <Text className="font-extrabold text-4xl text-white">Buat Akun</Text>
          <Text className="mt-2 text-base text-white/80">
            Mulai kelola keuanganmu hari ini 🚀
          </Text>
        </LinearGradient>

        <Card className="-mt-7 mx-5 gap-4 p-5">
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
            <Text className="text-sm text-error dark:text-error-dark">
              {register.error.message}
            </Text>
          ) : null}

          <Button title="Daftar" variant="gradient" loading={register.isPending} onPress={onSubmit} />
        </Card>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-sm text-muted dark:text-muted-dark">Sudah punya akun?</Text>
          <Link href="/(auth)/login" asChild>
            <Text className="font-semibold text-sm text-primary dark:text-primary-dark">Masuk</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
