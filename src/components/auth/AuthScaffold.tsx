import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { gradients } from '@/constants/colors';

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
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#F7F4FF] dark:bg-bg-dark"
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-10 pt-24">
        <View className="mb-6 flex-row items-center gap-3">
          <LinearGradient
            colors={gradients.primary}
            style={{ height: 42, width: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}
          >
            <Ionicons name="analytics-outline" size={24} color="white" />
          </LinearGradient>
          <Text className="font-extrabold text-3xl text-ink dark:text-ink-dark">FinTrack</Text>
        </View>

        <Text className="font-extrabold text-3xl leading-10 text-ink dark:text-ink-dark">{title}</Text>
        <Text className="mt-3 text-base text-muted dark:text-muted-dark">{subtitle}</Text>
        <View className="mb-7 mt-5 h-1.5 w-10 rounded-full bg-primary" />

        <View className="gap-5 rounded-[30px] bg-white p-6 shadow-lg shadow-primary/10 dark:bg-card-dark">
          {children}
        </View>

        <Link href={footerHref} asChild>
          <Pressable className="mt-7 flex-row items-center rounded-3xl border border-line bg-white p-4 shadow-sm shadow-black/5 dark:border-line-dark dark:bg-card-dark">
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="person-outline" size={24} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted dark:text-muted-dark">{footerQuestion}</Text>
              <Text className="font-semibold text-base text-primary dark:text-primary-dark">{footerAction}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#6B7280" />
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
