import { useState } from 'react';
import { Image, Text, View } from 'react-native';

export function Avatar({ name, uri, size = 44 }: { name?: string; uri?: string | null; size?: number }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden bg-primary/15 dark:bg-primary-dark/20"
    >
      {uri && !failed ? (
        <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailedUri(uri)} />
      ) : (
        <Text
          style={{ fontSize: size * 0.36 }}
          className="font-bold text-primary dark:text-primary-dark"
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
