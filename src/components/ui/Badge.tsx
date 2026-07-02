import { Text, View } from 'react-native';

type Tone = 'positive' | 'negative' | 'neutral';

const tones: Record<Tone, { box: string; text: string }> = {
  positive: { box: 'bg-secondary/15 dark:bg-secondary-dark/20', text: 'text-secondary dark:text-secondary-dark' },
  negative: { box: 'bg-error/15 dark:bg-error-dark/20', text: 'text-error dark:text-error-dark' },
  neutral: { box: 'bg-line dark:bg-elevated-dark', text: 'text-muted dark:text-muted-dark' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${t.box}`}>
      <Text className={`font-semibold text-xs ${t.text}`}>{label}</Text>
    </View>
  );
}
