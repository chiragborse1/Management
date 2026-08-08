'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { useMess, useMesses, useMyFeedback, useSubmitFeedback } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import type { Feedback, FeedbackTargetType } from '@shared/types';
import type { Hostel } from '@shared/types';
import type { Pagination } from '@shared/types/api';

const TARGET_TYPE_OPTIONS: SelectOption[] = [
  { value: 'mess', label: 'Mess' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'room', label: 'Room', disabled: true },
  { value: 'admin', label: 'Admin', disabled: true },
];

/** API records use `_id`, shared types use `id` — read either. */
type RecordRef = string | { id?: string; _id?: string };

function recordId(ref: RecordRef): string {
  if (typeof ref === 'string') return ref;
  return ref._id ?? ref.id ?? '';
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange(star)}
          className={cn(
            'rounded p-0.5 transition-colors',
            star <= value ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400/70'
          )}
        >
          <Star className={cn('h-6 w-6', star <= value && 'fill-current')} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= Math.round(rating) ? 'fill-current text-amber-400' : 'text-muted-foreground'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ReviewTargetName({
  targetType,
  targetId,
}: {
  targetType: FeedbackTargetType;
  targetId: string;
}) {
  const { data, isLoading } = useMess(targetType === 'mess' ? targetId : '');
  if (targetType !== 'mess') return null;
  if (isLoading) return <Skeleton className="h-4 w-24" />;
  return <span className="text-foreground text-sm font-medium">{data?.mess.name ?? 'Mess'}</span>;
}

export default function Feedback() {
  const [targetType, setTargetType] = useState<FeedbackTargetType>('mess');
  const [targetId, setTargetId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: feedbackData, isLoading: feedbackLoading } = useMyFeedback();
  const { data: messesData, isLoading: messesLoading } = useMesses();
  const { data: hostelsData, isLoading: hostelsLoading } = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => {
      const response = await apiClient.get<{ hostels: Hostel[]; pagination: Pagination }>(
        '/hostels'
      );
      return response.data.hostels;
    },
    enabled: targetType === 'hostel',
  });
  const submitFeedback = useSubmitFeedback();

  const reviews = feedbackData?.feedback ?? [];
  const isTargetAvailable = targetType === 'mess' || targetType === 'hostel';
  const targetOptions: SelectOption[] =
    targetType === 'mess'
      ? (messesData?.messes ?? []).map((mess) => ({ value: recordId(mess), label: mess.name }))
      : targetType === 'hostel'
        ? (hostelsData ?? []).map((hostel) => ({ value: recordId(hostel), label: hostel.name }))
        : [];
  const targetsLoading =
    targetType === 'mess' ? messesLoading : targetType === 'hostel' ? hostelsLoading : false;

  // Prefill the form when the student already reviewed the selected target;
  // submitting again upserts the existing review server-side.
  const existing =
    reviews.find((review) => review.targetType === targetType && review.targetId === targetId) ??
    null;

  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment ?? '');
      setIsAnonymous(existing.isAnonymous);
    } else {
      setRating(0);
      setComment('');
      setIsAnonymous(false);
    }
  }, [existing]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!isTargetAvailable) {
      toast.error('Room and admin reviews are not available yet');
      return;
    }
    if (!targetId) {
      toast.error('Select a target to review');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error('Please pick a star rating');
      return;
    }
    submitFeedback.mutate(
      {
        targetId,
        targetType,
        rating,
        comment: comment.trim() || undefined,
        isAnonymous,
      },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
          setIsAnonymous(false);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Feedback</h1>
        <p className="text-muted-foreground">
          Review your mess and hostel — your ratings help everyone.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* My reviews */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>My Reviews</CardTitle>
            <CardDescription>
              {reviews.length > 0
                ? `${reviews.length} review${reviews.length > 1 ? 's' : ''} submitted`
                : 'Reviews you submit will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((row) => (
                  <Skeleton key={row} className="h-24 w-full" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Rate your mess or hostel using the form to see it here."
              />
            ) : (
              <ul className="space-y-3">
                {reviews.map((review: Feedback) => (
                  <li
                    key={recordId(review)}
                    className="border-border space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={review.targetType === 'mess' ? 'info' : 'neutral'}>
                          {prettyLabel(review.targetType)}
                        </Badge>
                        <ReviewTargetName
                          targetType={review.targetType}
                          targetId={review.targetId}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <StarRatingDisplay rating={review.rating} />
                    {review.comment && (
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    )}
                    {review.isAnonymous && <Badge variant="neutral">Anonymous</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Submit review */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit a Review</CardTitle>
            <CardDescription>
              {existing
                ? 'You already reviewed this target — submitting will update it.'
                : 'Share your experience with a rating and an optional comment.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Review type"
                placeholder="Select a type"
                options={TARGET_TYPE_OPTIONS}
                value={targetType}
                onChange={(value) => {
                  setTargetType(value as FeedbackTargetType);
                  setTargetId('');
                }}
              />
              {isTargetAvailable ? (
                targetsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Select
                    label="Target"
                    placeholder={targetType === 'mess' ? 'Select a mess' : 'Select a hostel'}
                    options={targetOptions}
                    value={targetId}
                    onChange={setTargetId}
                  />
                )
              ) : (
                <div className="border-border text-muted-foreground rounded-md border border-dashed px-3 py-2 text-sm">
                  Room and admin reviews are not available yet.
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="feedback-comment">Comment (optional)</Label>
                <Textarea
                  id="feedback-comment"
                  placeholder="What did you like or dislike?"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  className="border-border bg-background text-primary focus-visible:ring-ring h-4 w-4 rounded focus-visible:ring-2 focus-visible:outline-none"
                />
                <span className="text-muted-foreground">
                  Submit anonymously (your name won't be shown)
                </span>
              </label>
              <Button
                type="submit"
                className="w-full"
                isLoading={submitFeedback.isPending}
                leftIcon={<Star className="h-4 w-4" aria-hidden="true" />}
              >
                {existing ? 'Update Review' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
