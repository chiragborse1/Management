'use client';

import { CalendarRange, IndianRupee, Star, Utensils, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMessStats, useMyMess, useMySubscribers } from '@/hooks';
import type { OwnerSubscription } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SubscriptionStatus } from '@shared/types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_VARIANT: Record<SubscriptionStatus, BadgeVariant> = {
  active: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: 'neutral',
  expired: 'neutral',
};

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function studentName(subscription: OwnerSubscription): string {
  return typeof subscription.studentId === 'string'
    ? subscription.studentId
    : subscription.studentId.name;
}

function studentId(subscription: OwnerSubscription): string {
  return typeof subscription.studentId === 'string'
    ? '—'
    : (subscription.studentId.studentId ?? '—');
}

export default function Revenue() {
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const { data: statsData, isLoading: statsLoading } = useMessStats();
  const { data: subscribersData, isLoading: subscribersLoading } = useMySubscribers();

  const mess = profileData?.mess ?? null;
  const stats = statsData?.stats;
  const subscribers = subscribersData?.subscribers ?? [];

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Revenue</h1>
          <p className="text-muted-foreground">Track subscribers and monthly revenue.</p>
        </div>
        <EmptyState
          icon={Utensils}
          title="Create your mess profile first"
          description="Revenue and subscriber data will appear here once your mess is live."
          action={
            <Link to="/mess-owner/profile">
              <Button>Create Mess Profile</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Revenue</h1>
        <p className="text-muted-foreground">Track subscribers and monthly revenue.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Subscribers"
          value={statsLoading ? <Skeleton className="h-7 w-14" /> : String(stats?.subscribers ?? 0)}
          icon={Users}
        />
        <StatCard
          label="Pending Requests"
          value={
            statsLoading ? <Skeleton className="h-7 w-14" /> : String(stats?.pendingRequests ?? 0)
          }
          icon={CalendarRange}
        />
        <StatCard
          label="Monthly Revenue"
          value={
            statsLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              formatCurrency(stats?.monthlyRevenue ?? 0)
            )
          }
          icon={IndianRupee}
        />
        <StatCard
          label="Average Rating"
          value={
            statsLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : stats ? (
              stats.avgRating.toFixed(1)
            ) : (
              '—'
            )
          }
          icon={Star}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Subscribers</CardTitle>
          <CardDescription>
            {stats ? `${stats.menusPublished} of 7 weekly menus published` : 'Subscriber list'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscribersLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </div>
          ) : subscribers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No subscribers yet"
              description="Students who subscribe to your mess will be listed here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscription) => (
                    <TableRow key={subscription._id}>
                      <TableCell className="text-foreground font-medium">
                        {studentName(subscription)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {studentId(subscription)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{prettyLabel(subscription.plan)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[subscription.status] ?? 'neutral'}>
                          {prettyLabel(subscription.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscription.startDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(subscription.endDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
