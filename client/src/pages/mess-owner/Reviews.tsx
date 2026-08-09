'use client';

import { MessageSquareQuote, Star, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMessStats, useMyMess, useMyReviews } from '@/hooks';
import { Button, Card, CardContent, EmptyState, Skeleton, StatCard } from '@/components/ui';
import { formatDate } from '@/lib/utils';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={
            star <= Math.round(rating)
              ? 'h-4 w-4 fill-amber-400 text-amber-400'
              : 'text-muted-foreground h-4 w-4'
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const { data: statsData, isLoading: statsLoading } = useMessStats();
  const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews();

  const mess = profileData?.mess ?? null;
  const stats = statsData?.stats;
  const reviews = reviewsData?.feedback ?? [];

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2">
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
          <h1 className="text-foreground text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">See what students are saying about your mess.</p>
        </div>
        <EmptyState
          icon={Utensils}
          title="Create your mess profile first"
          description="Reviews appear here once students start rating your mess."
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
        <h1 className="text-foreground text-2xl font-bold">Reviews</h1>
        <p className="text-muted-foreground">See what students are saying about your mess.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          sub="From student feedback"
          icon={Star}
        />
        <StatCard
          label="Total Reviews"
          value={
            statsLoading ? <Skeleton className="h-7 w-14" /> : String(stats?.totalReviews ?? 0)
          }
          sub="Across all feedback"
          icon={MessageSquareQuote}
        />
      </div>

      {reviewsLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-24 w-full" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Students haven't rated your mess yet. Once they do, their feedback will show up here."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review._id ?? review.id ?? review.createdAt}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <StarRating rating={review.rating} />
                  <span className="text-muted-foreground text-xs">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-muted-foreground mt-2 text-sm">{review.comment}</p>
                )}
                <p className="text-muted-foreground mt-2 text-xs">
                  {review.isAnonymous ? 'Anonymous' : 'Verified student'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
