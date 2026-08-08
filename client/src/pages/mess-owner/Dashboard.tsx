'use client';

import { Calendar, Star, Users, Utensils, Wallet } from 'lucide-react';
import {
  useMesses,
  // Defensive import: only present once the API layer exposes it. Remove if absent.
  useTargetFeedback,
  useWeeklyMenu,
} from '@/hooks';
import {
  Card,
  CardContent,
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
import { formatDate } from '@/lib/utils';
import type { Menu } from '@shared/types';

type MessRef = string | { id?: string; _id?: string };

function recordId(ref: MessRef): string {
  if (typeof ref === 'string') return ref;
  return ref._id ?? ref.id ?? '';
}

function reviewId(review: { id: string; _id?: string }): string {
  return review._id ?? review.id;
}

const DAY_ORDER: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function mealSummary(menu: Menu, meal: 'breakfast' | 'lunch' | 'dinner'): string {
  const items = menu.meals[meal];
  if (items.length === 0) return '—';
  return items.map((item) => item.name).join(', ');
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
  const { data: messesData, isLoading: messesLoading } = useMesses();
  const messes = messesData?.messes ?? [];
  const firstMess = messes[0];

  const firstMessId = firstMess ? recordId(firstMess) : '';
  const { data: menuData, isLoading: menuLoading, error: menuError } = useWeeklyMenu(firstMessId);
  const { data: feedbackData, isLoading: feedbackLoading } = useTargetFeedback('mess', firstMessId);

  const avgRating =
    messes.length > 0 ? messes.reduce((sum, mess) => sum + mess.rating, 0) / messes.length : 0;
  const totalReviews = messes.reduce((sum, mess) => sum + mess.totalReviews, 0);

  const menus = menuData?.menus ?? [];
  const sortedMenus = [...menus].sort(
    (a, b) => (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Mess Owner Dashboard</h1>
        <p className="text-muted-foreground">Here's how your mess is doing.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My Mess"
          value={
            messesLoading ? <Skeleton className="h-7 w-32" /> : firstMess ? firstMess.name : '—'
          }
          sub={
            firstMess
              ? `${firstMess.city} · ${firstMess.type}`
              : messesLoading
                ? undefined
                : 'Owner-scoped mess data arrives in Step 5'
          }
          icon={Utensils}
        />
        <StatCard
          label="Average Rating"
          value={
            messesLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : messes.length > 0 ? (
              avgRating.toFixed(1)
            ) : (
              '—'
            )
          }
          sub={messes.length > 0 ? 'Across listed messes' : undefined}
          icon={Star}
        />
        <StatCard
          label="Total Reviews"
          value={messesLoading ? <Skeleton className="h-7 w-14" /> : String(totalReviews)}
          sub={messes.length > 0 ? 'Cumulative review count' : undefined}
          icon={Star}
        />
        <StatCard
          label="Weekly Menu"
          value={menuLoading ? <Skeleton className="h-7 w-20" /> : `${menus.length}/7 days`}
          sub={menus.length > 0 ? 'Published this week' : 'Menu publishing arrives in Step 5'}
          icon={Calendar}
        />
      </div>

      {/* Weekly menu + placeholders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Menu */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This Week's Menu</CardTitle>
          </CardHeader>
          <CardContent>
            {menuLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            ) : menuError ? (
              <EmptyState
                icon={Calendar}
                title="Couldn't load the weekly menu"
                description="Something went wrong while fetching the menu for this mess."
              />
            ) : sortedMenus.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No weekly menu published yet"
                description="Menu publishing tools arrive with the Mess Owner module (Step 5)."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Breakfast</TableHead>
                      <TableHead>Lunch</TableHead>
                      <TableHead>Dinner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMenus.map((menu) => (
                      <TableRow key={menu.id}>
                        <TableCell className="text-foreground font-medium">
                          {DAY_LABELS[menu.dayOfWeek] ?? menu.dayOfWeek}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mealSummary(menu, 'breakfast')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mealSummary(menu, 'lunch')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {mealSummary(menu, 'dinner')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholders */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Users}
                title="Subscription management arrives in Step 5 (Mess Owner module)"
                description="Subscriber lists, plan renewals, and approvals will live here."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Wallet}
                title="Revenue analytics arrive in Step 5 (Mess Owner module)"
                description="Collections, dues, and revenue trends will show up here."
              />
            </CardContent>
          </Card>

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
                      ? "Students haven't rated this mess yet."
                      : 'No mess linked to your account yet.'
                  }
                />
              ) : (
                <div className="space-y-3">
                  {feedbackData.feedback.slice(0, 4).map((review) => (
                    <div key={reviewId(review)} className="border-border rounded-lg border p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-muted-foreground text-xs">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
