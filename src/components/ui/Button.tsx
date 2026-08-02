import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary dark:bg-primary-dark',
  secondary: 'bg-ink dark:bg-ink-dark',
  quiet: 'bg-transparent border border-line dark:border-line-dark',
  danger: 'bg-error dark:bg-error-dark',
};

const label: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-bg dark:text-bg-dark',
  quiet: 'text-ink dark:text-ink-dark',
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
    <ActivityIndicator color={variant === 'quiet' ? undefined : variant === 'secondary' ? '#F5F0E7' : '#fff'} />
  ) : (
    <Text className={`font-semibold text-base ${label[variant]}`}>{title}</Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      className={`h-14 min-w-11 items-center justify-center rounded-xl active:scale-[0.98] active:opacity-90 ${container[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {inner}
    </Pressable>
  );
}
