import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('bg-muted animate-pulse rounded-md', className)} />;
}
