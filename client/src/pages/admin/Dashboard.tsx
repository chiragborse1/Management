'use client';

import { Building2, MessageSquare, Star, Utensils } from 'lucide-react';
import {
  useMesses,
  // Defensive import: only present once the API layer exposes it. Remove if absent.
  useTargetFeedback,
} from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  StatCard,
} from '@/components/ui';
import { BarTrendChart } from '@/components/charts/BarTrendChart';
import { formatDate, truncate } from '@/lib/utils';

interface ReviewDatum {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

type MessRef = string | { id?: string; _id?: string };

function recordId(ref: MessRef): string {
  if (typeof ref === 'string') return ref;
  return ref._id ?? ref.id ?? '';
}

function reviewId(review: { id: string; _id?: string }): string {
  return review._id ?? review.id;
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

function ReviewCard({ review }: { review: ReviewDatum }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <StarRating rating={review.rating} />
        <span className="text-muted-foreground text-xs">{formatDate(review.createdAt)}</span>
      </div>
      {review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: messesData, isLoading: messesLoading, error: messesError } = useMesses();
  const messes = messesData?.messes ?? [];

  const firstMess = messes[0];
  const firstMessId = firstMess ? recordId(firstMess) : '';
  const { data: feedbackData, isLoading: feedbackLoading } = useTargetFeedback('mess', firstMessId);

  const hostelRefs = messes
    .map((mess) => (mess as { hostelId?: string }).hostelId)
    .filter((hostelId): hostelId is string => Boolean(hostelId));
  const hostelCount =
    hostelRefs.length > 0 ? new Set(hostelRefs).size : new Set(messes.map((m) => m.city)).size;
  const avgRating =
    messes.length > 0 ? messes.reduce((sum, mess) => sum + mess.rating, 0) / messes.length : 0;
  const totalReviews = messes.reduce((sum, mess) => sum + mess.totalReviews, 0);

  const ratingData = [...messes]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8)
    .map((mess) => ({ label: truncate(mess.name, 14), value: mess.rating }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Here's what's happening across your hostels.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Hostels"
          value={messesLoading ? <Skeleton className="h-7 w-12" /> : String(hostelCount)}
          sub="Distinct hostels in the mess directory"
          icon={Building2}
        />
        <StatCard
          label="Messes"
          value={messesLoading ? <Skeleton className="h-7 w-12" /> : String(messes.length)}
          sub={
            messesData ? `${messesData.pagination?.total ?? messes.length} total listed` : undefined
          }
          icon={Utensils}
        />
        <StatCard
          label="Average Rating"
          value={messesLoading ? <Skeleton className="h-7 w-16" /> : avgRating.toFixed(1)}
          sub="Across all listed messes"
          icon={Star}
        />
        <StatCard
          label="Total Reviews"
          value={messesLoading ? <Skeleton className="h-7 w-16" /> : String(totalReviews)}
          sub="Cumulative review count"
          icon={MessageSquare}
        />
      </div>

      {/* Charts + placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mess ratings trend */}
        <Card>
          <CardHeader>
            <CardTitle>Top-Rated Messes</CardTitle>
          </CardHeader>
          <CardContent>
            {messesLoading ? (
              <Skeleton className="h-60 w-full" />
            ) : messesError ? (
              <EmptyState
                icon={Star}
                title="Couldn't load mess ratings"
                description="Something went wrong while fetching the mess directory."
              />
            ) : ratingData.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No messes listed yet"
                description="The mess directory is empty — ratings will appear here once messes are onboarded."
              />
            ) : (
              <BarTrendChart data={ratingData} valueName="Rating" yDomain={[0, 5]} height={240} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Recent reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((row) => (
                    <Skeleton key={row} className="h-16 w-full" />
                  ))}
                </div>
              ) : !feedbackData || feedbackData.feedback.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description={
                    firstMessId
                      ? "Students haven't rated messes yet."
                      : 'No messes in the directory to review.'
                  }
                />
              ) : (
                <div className="space-y-3">
                  {feedbackData.feedback.slice(0, 4).map((review) => (
                    <ReviewCard key={reviewId(review)} review={review} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 5 placeholder — admin module */}
          <Card>
            <CardHeader>
              <CardTitle>Complaints Kanban</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={MessageSquare}
                title="Admin analytics arrive with the admin module (Step 5)"
                description="Room occupancy, complaint triage, and revenue analytics will live here once the admin module ships."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
