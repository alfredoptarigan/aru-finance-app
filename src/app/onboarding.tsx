import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View, type ViewToken } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelMark } from '@/components/PixelMark';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

const SLIDES = [
  {
    title: 'Know where every rupiah goes.',
    subtitle: 'Record income and spending in a ledger built for quick daily use.',
  },
  {
    title: 'Read the pattern, not the noise.',
    subtitle: 'See useful spending trends and the categories shaping your month.',
  },
  {
    title: 'Give tomorrow a number.',
    subtitle: 'Plan budgets, savings goals, and bills without losing the daily picture.',
  },
  {
    title: 'Stay ahead of the month.',
    subtitle: 'Get clear warnings when a budget or upcoming bill needs attention.',
  },
] as const;

export default function Onboarding() {
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const isLast = page === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding();
    router.replace('/');
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setPage(viewableItems[0].index);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-bg-dark">
      <View className="h-12 flex-row items-center justify-end px-6">
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <Text className="font-medium text-sm text-muted dark:text-muted-dark">Skip</Text>
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
          <View style={{ width }} className="justify-center px-8">
            <Animated.View
              key={`${index}-${page === index}`}
              entering={FadeInDown.duration(350).reduceMotion(ReduceMotion.System)}
              className="items-start"
            >
              <View className="mb-12 -ml-8 w-52 items-end rounded-r-2xl border border-l-0 border-line bg-card py-3 pr-5 dark:border-line-dark dark:bg-card-dark">
                <PixelMark size={156} />
              </View>
              <Text className="mb-3 font-medium text-xs tracking-[2px] text-primary dark:text-primary-dark">
                ENTRY {String(index + 1).padStart(2, '0')}
              </Text>
              <View className="max-w-80 gap-4">
                <Text className="font-extrabold text-4xl leading-[43px] text-ink dark:text-ink-dark">
                  {item.title}
                </Text>
                <Text className="text-base leading-6 text-muted dark:text-muted-dark">
                  {item.subtitle}
                </Text>
              </View>
            </Animated.View>
          </View>
        )}
      />

      <View className="gap-8 px-8 pb-6">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{ width: i === page ? 24 : 8, opacity: i === page ? 1 : 0.35 }}
              className="h-1 rounded-full bg-primary dark:bg-primary-dark"
            />
          ))}
        </View>
        <Button
          title={isLast ? 'Open your ledger' : 'Continue'}
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
