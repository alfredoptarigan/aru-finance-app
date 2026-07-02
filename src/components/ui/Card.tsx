import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  elevated?: boolean;
}

export function Card({ className = '', elevated = false, ...props }: CardProps) {
  return (
    <View
      className={`rounded-3xl bg-card p-4 shadow-sm shadow-black/5 ${
        elevated ? 'dark:bg-elevated-dark' : 'dark:bg-card-dark'
      } ${className}`}
      {...props}
    />
  );
}
