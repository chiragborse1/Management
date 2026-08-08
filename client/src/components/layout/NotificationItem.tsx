'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Utensils,
  Home,
  Star,
  Bell,
} from 'lucide-react';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    unread: boolean;
  };
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  complaint_submitted: AlertCircle,
  complaint_updated: Clock,
  complaint_resolved: CheckCircle,
  payment_due: CreditCard,
  payment_received: CheckCircle,
  payment_failed: AlertCircle,
  subscription_approved: CheckCircle,
  subscription_rejected: AlertCircle,
  subscription_expiring: Clock,
  menu_published: Utensils,
  room_allocated: Home,
  room_change_request: Home,
  announcement: Bell,
  feedback_received: Star,
  system: AlertCircle,
};

const typeColors: Record<string, string> = {
  complaint_submitted: 'text-orange-500 bg-orange-500/10',
  complaint_updated: 'text-blue-500 bg-blue-500/10',
  complaint_resolved: 'text-green-500 bg-green-500/10',
  payment_due: 'text-orange-500 bg-orange-500/10',
  payment_received: 'text-green-500 bg-green-500/10',
  payment_failed: 'text-red-500 bg-red-500/10',
  subscription_approved: 'text-green-500 bg-green-500/10',
  subscription_rejected: 'text-red-500 bg-red-500/10',
  subscription_expiring: 'text-orange-500 bg-orange-500/10',
  menu_published: 'text-blue-500 bg-blue-500/10',
  room_allocated: 'text-purple-500 bg-purple-500/10',
  room_change_request: 'text-purple-500 bg-purple-500/10',
  announcement: 'text-indigo-500 bg-indigo-500/10',
  feedback_received: 'text-yellow-500 bg-yellow-500/10',
  system: 'text-gray-500 bg-gray-500/10',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || 'text-gray-500 bg-gray-500/10';

  return (
    <div
      className={cn(
        'hover:bg-accent/50 px-4 py-3 transition-colors',
        notification.unread && 'bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 rounded-full p-1.5', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium', notification.unread && 'font-semibold')}>
            {notification.title}
          </p>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
            {notification.message}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{notification.time}</p>
        </div>
        {notification.unread && (
          <span className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
        )}
      </div>
    </div>
  );
}
