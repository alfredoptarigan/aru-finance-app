import { Text, View } from 'react-native';

export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-primary/15 dark:bg-primary-dark/20"
    >
      <Text
        style={{ fontSize: size * 0.36 }}
        className="font-bold text-primary dark:text-primary-dark"
      >
        {initials}
      </Text>
    </View>
  );
}
