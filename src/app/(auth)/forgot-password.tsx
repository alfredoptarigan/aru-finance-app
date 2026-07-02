import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const schema = z.object({ email: z.string().email('Email tidak valid') });
type FormValues = z.infer<typeof schema>;

// ponytail: backend belum expose endpoint reset password — tampilkan pesan
// info dan arahkan user kembali ke login, sambungkan saat endpoint tersedia.
export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-5"
      >
        <Card className="gap-4 p-5">
          <View className="gap-1">
            <Text className="font-bold text-2xl text-ink dark:text-ink-dark">Lupa Password</Text>
            <Text className="text-sm text-muted dark:text-muted-dark">
              Masukkan email kamu. Fitur reset password otomatis segera hadir — untuk saat ini
              tim kami akan menghubungimu secara manual.
            </Text>
          </View>

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

          {sent ? (
            <Text className="text-sm text-secondary dark:text-secondary-dark">
              Permintaan tercatat. Kami akan menghubungimu lewat email tersebut.
            </Text>
          ) : null}

          <Button
            title="Kirim Permintaan"
            variant="gradient"
            onPress={handleSubmit(() => setSent(true))}
          />
          <Button title="Kembali" variant="ghost" onPress={() => router.back()} />
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
