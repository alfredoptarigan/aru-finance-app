import { MotiView } from 'moti';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <MotiView
      from={{ opacity: 0.35 }}
      animate={{ opacity: 0.8 }}
      transition={{ type: 'timing', duration: 700, loop: true }}
      className={`rounded-2xl bg-line dark:bg-elevated-dark ${className}`}
    />
  );
}
