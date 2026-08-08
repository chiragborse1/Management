import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'border-primary inline-block animate-spin rounded-full border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}
