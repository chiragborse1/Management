'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Notification } from '@shared/types';

type NotificationBadge = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

function notificationVariant(type: string): NotificationBadge {
  if (type.startsWith('complaint_')) return 'warning';
  if (type.startsWith('payment_')) return 'info';
  if (type.startsWith('subscription_')) return 'default';
  if (type.startsWith('room_')) return 'default';
  if (type === 'feedback_received') return 'success';
  if (type === 'system') return 'neutral';
  return 'default';
}

/** API records use `_id`, shared types use `id` — read either. */
function recordId(record: { id?: string; _id?: string }): string {
  return record._id ?? record.id ?? '';
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleOpen(notification: Notification): void {
    if (notification.isRead) return;
    markRead.mutate(recordId(notification), {
      onSuccess: () => toast.success('Notification marked as read'),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && <Badge variant="default">{unreadCount} new</Badge>}
          </div>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`
              : "You're all caught up."}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => markAll.mutate(undefined)}
          isLoading={markAll.isPending}
          disabled={unreadCount === 0}
          leftIcon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
        >
          Mark all read
        </Button>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-24 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="Notifications about payments, complaints and your mess will show up here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const unread = !notification.isRead;
            return (
              <button
                key={recordId(notification)}
                type="button"
                onClick={() => handleOpen(notification)}
                className={cn(
                  'border-border w-full rounded-lg border text-left transition-colors',
                  unread
                    ? 'bg-primary/5 border-primary/30 hover:bg-primary/10 border-l-primary border-l-4'
                    : 'bg-card hover:bg-accent/50 border-l-4 border-l-transparent'
                )}
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {unread && (
                        <span
                          className="bg-primary h-2 w-2 shrink-0 rounded-full"
                          aria-hidden="true"
                        />
                      )}
                      <p
                        className={cn(
                          'text-foreground text-sm',
                          unread ? 'font-semibold' : 'font-medium'
                        )}
                      >
                        {notification.title}
                      </p>
                      <Badge variant={notificationVariant(notification.type)}>
                        {prettyLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">{notification.message}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
