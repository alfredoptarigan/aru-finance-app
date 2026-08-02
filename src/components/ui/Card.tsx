import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  elevated?: boolean;
}

export function Card({ className = '', elevated = false, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-card p-4 ${
        elevated ? 'dark:bg-elevated-dark' : 'dark:bg-card-dark'
      } ${className}`}
      {...props}
    />
  );
}
