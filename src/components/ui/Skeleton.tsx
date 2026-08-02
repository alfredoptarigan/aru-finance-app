import { View } from 'react-native';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <View className={`rounded-xl bg-line/70 dark:bg-elevated-dark ${className}`} />
  );
}
