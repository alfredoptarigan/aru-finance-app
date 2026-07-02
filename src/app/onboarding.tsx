import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View, type ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { gradients } from '@/constants/colors';
import { useAuthStore } from '@/stores/auth';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'wallet-outline',
    gradient: gradients.primary,
    title: 'Track Your Money Effortlessly',
    subtitle: 'Catat pemasukan dan pengeluaran harianmu dengan cepat.',
  },
  {
    icon: 'pie-chart-outline',
    gradient: gradients.expense,
    title: 'Understand Your Spending',
    subtitle: 'Lihat kategori pengeluaran terbesar dan kebiasaan finansialmu.',
  },
  {
    icon: 'flag-outline',
    gradient: gradients.saving,
    title: 'Set Budgets & Goals',
    subtitle: 'Buat budget bulanan dan target tabungan agar keuangan lebih terarah.',
  },
  {
    icon: 'notifications-outline',
    gradient: gradients.income,
    title: 'Stay in Control',
    subtitle: 'Dapatkan insight, alert budget, dan ringkasan cashflow.',
  },
] as const;

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const isLast = page === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setPage(viewableItems[0].index);
  }).current;

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="h-12 flex-row items-center justify-end px-6">
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <Text className="font-medium text-sm text-muted dark:text-muted-dark">Lewati</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item, index }) => (
          <View style={{ width }} className="items-center justify-center gap-8 px-8">
            <MotiView
              key={`${index}-${page === index}`}
              from={{ opacity: 0, scale: 0.85, translateY: 12 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 450 }}
              className="items-center gap-8"
            >
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: 56,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={item.icon} size={80} color="#fff" />
              </LinearGradient>
              <View className="gap-3">
                <Text className="text-center font-extrabold text-3xl text-ink dark:text-ink-dark">
                  {item.title}
                </Text>
                <Text className="text-center text-base leading-6 text-muted dark:text-muted-dark">
                  {item.subtitle}
                </Text>
              </View>
            </MotiView>
          </View>
        )}
      />

      <View className="gap-8 px-8 pb-6">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{ width: i === page ? 24 : 8, opacity: i === page ? 1 : 0.35 }}
              transition={{ type: 'timing', duration: 250 }}
              className="h-2 rounded-full bg-primary dark:bg-primary-dark"
            />
          ))}
        </View>
        <Button
          title={isLast ? 'Get Started' : 'Lanjut'}
          variant="gradient"
          onPress={() =>
            isLast
              ? void finish()
              : listRef.current?.scrollToIndex({ index: page + 1, animated: true })
          }
        />
      </View>
    </SafeAreaView>
  );
}
