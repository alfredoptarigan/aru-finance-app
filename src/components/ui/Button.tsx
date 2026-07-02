import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { gradients } from '@/constants/colors';

type Variant = 'primary' | 'gradient' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary dark:bg-primary-dark',
  gradient: '',
  ghost: 'bg-transparent border border-line dark:border-line-dark',
  danger: 'bg-error dark:bg-error-dark',
};

const label: Record<Variant, string> = {
  primary: 'text-white',
  gradient: 'text-white',
  ghost: 'text-ink dark:text-ink-dark',
  danger: 'text-white',
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const inner = loading ? (
    <ActivityIndicator color={variant === 'ghost' ? undefined : '#fff'} />
  ) : (
    <Text className={`font-semibold text-base ${label[variant]}`}>{title}</Text>
  );

  if (variant === 'gradient') {
    return (
      <Pressable
        disabled={disabled || loading}
        className={`overflow-hidden rounded-2xl active:opacity-80 ${disabled ? 'opacity-50' : ''} ${className}`}
        {...props}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 56, alignItems: 'center', justifyContent: 'center' }}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      className={`h-14 items-center justify-center rounded-2xl active:opacity-80 ${container[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {inner}
    </Pressable>
  );
}
