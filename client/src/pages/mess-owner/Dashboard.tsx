'use client';

import { useState } from 'react';
import { CalendarDays, Check, Star, Users, Wallet, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAcceptSubscription,
  useMessStats,
  useMyMess,
  useMyReviews,
  useRejectSubscription,
  useSubscriptionRequests,
} from '@/hooks';
import type { OwnerSubscription } from '@/hooks';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  Modal,
  Skeleton,
  StatCard,
  Textarea,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function studentName(subscription: OwnerSubscription): string {
  return typeof subscription.studentId === 'string'
    ? subscription.studentId
    : subscription.studentId.name;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= Math.round(rating)
              ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400'
              : 'text-muted-foreground h-3.5 w-3.5'
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function MessOwnerDashboard() {
  const { user } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const { data: statsData, isLoading: statsLoading } = useMessStats();
  const { data: pendingData, isLoading: pendingLoading } = useSubscriptionRequests('pending');
  const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews();

  const mess = profileData?.mess ?? null;
  const stats = statsData?.stats;
  const pending = pendingData?.requests ?? [];
  const reviews = reviewsData?.feedback ?? [];

  const [rejecting, setRejecting] = useState<OwnerSubscription | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const acceptSubscription = useAcceptSubscription();
  const rejectSubscription = useRejectSubscription();

  const firstName = user?.name.split(' ')[0] ?? 'there';

  function closeReject(): void {
    setRejecting(null);
    setRejectReason('');
  }

  function handleReject(): void {
    if (!rejecting) return;
    rejectSubscription.mutate(
      { id: rejecting._id, reason: rejectReason.trim() || undefined },
      { onSuccess: closeReject }
    );
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Welcome back, {firstName}</h1>
          <p className="text-muted-foreground">Here's how your mess is doing.</p>
        </div>
        <EmptyState
          icon={Users}
          title="Create your mess profile to get started"
          description="Set up your mess details, menu, and pricing so students can find and subscribe to you."
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
        <h1 className="text-foreground text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground">Here's how your mess is doing.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Subscribers"
          value={statsLoading ? <Skeleton className="h-7 w-14" /> : String(stats?.subscribers ?? 0)}
          icon={Users}
        />
        <StatCard
          label="Pending Requests"
          value={
            statsLoading ? <Skeleton className="h-7 w-14" /> : String(stats?.pendingRequests ?? 0)
          }
          icon={CalendarDays}
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
          icon={Wallet}
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Pending Requests</CardTitle>
            <Link
              to="/mess-owner/subscriptions"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-16 w-full" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No pending requests"
                description="New subscription requests will appear here."
              />
            ) : (
              <div className="space-y-3">
                {pending.slice(0, 3).map((request) => (
                  <div
                    key={request._id}
                    className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">
                        {studentName(request)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {prettyLabel(request.plan)} · {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptSubscription.mutate(request._id)}
                        isLoading={
                          acceptSubscription.isPending &&
                          acceptSubscription.variables === request._id
                        }
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectReason('');
                          setRejecting(request);
                        }}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Reviews</CardTitle>
            <Link
              to="/mess-owner/reviews"
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-16 w-full" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Student ratings will show up here."
              />
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review._id ?? review.id ?? review.createdAt}>
                    <StarRating rating={review.rating} />
                    {review.comment && (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {review.comment}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      {review.isAnonymous ? 'Anonymous' : 'Verified student'} ·{' '}
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={rejecting !== null}
        onClose={closeReject}
        title="Reject subscription request?"
        description={
          rejecting
            ? `Reject ${studentName(rejecting)}'s ${prettyLabel(rejecting.plan)} request. You can add an optional reason for the student.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={closeReject} disabled={rejectSubscription.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              isLoading={rejectSubscription.isPending}
            >
              Reject
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="e.g. No seats available this month"
          />
        </div>
      </Modal>
    </div>
  );
}
