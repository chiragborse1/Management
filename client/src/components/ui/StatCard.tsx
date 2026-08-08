import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './Card';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-foreground mt-1 truncate text-2xl font-semibold tracking-tight">
            {value}
          </p>
          {sub && <p className="text-muted-foreground mt-1 text-sm">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              'bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
