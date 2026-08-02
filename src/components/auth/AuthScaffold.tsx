import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { PixelMark } from '@/components/PixelMark';
import { AppIcon } from '@/components/ui/AppIcon';
import { useThemeColors } from '@/stores/theme';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  footerQuestion: string;
  footerAction: string;
  footerHref: Href;
  children: ReactNode;
};


export function AuthScaffold({
  title,
  subtitle,
  footerQuestion,
  footerAction,
  footerHref,
  children,
}: AuthScaffoldProps) {
  const colors = useThemeColors();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-bg dark:bg-bg-dark"
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 pb-10 pt-16">
        <View className="mb-8 flex-row items-start gap-3">
          <View className="min-w-0 flex-1 pt-5">
            <Text className="font-medium text-sm tracking-[2px] text-primary dark:text-primary-dark">LEDGERIA</Text>
            <Text className="mt-2 max-w-64 font-extrabold text-4xl leading-[42px] text-ink dark:text-ink-dark">{title}</Text>
          </View>
          <View className="shrink-0 rounded-2xl border border-line bg-card p-2 dark:border-line-dark dark:bg-card-dark">
            <PixelMark size={88} />
          </View>
        </View>
        <Text className="mb-5 max-w-80 text-base leading-6 text-muted dark:text-muted-dark">{subtitle}</Text>
        <View className="gap-5 border-y border-line py-6 dark:border-line-dark">
          {children}
        </View>

        <Link href={footerHref} asChild>
          <Pressable className="mt-6 min-h-14 flex-row items-center border-b border-line py-3 active:opacity-70 dark:border-line-dark">
            <View className="flex-1">
              <Text className="text-sm text-muted dark:text-muted-dark">{footerQuestion}</Text>
              <Text className="font-semibold text-base text-primary dark:text-primary-dark">{footerAction}</Text>
            </View>
            <AppIcon name="chevronRight" size={20} color={colors.muted} />
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
