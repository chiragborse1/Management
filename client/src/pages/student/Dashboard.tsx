'use client';

import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Home, MessageSquare, Utensils } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMenuToday,
  useMonthlyBill,
  useMyComplaints,
  useMyPayments,
  useMyProfile,
  useMySubscriptions,
} from '@/hooks';
import {
  Badge,
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
import { DonutChart } from '@/components/charts/DonutChart';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { MenuItem } from '@shared/types';

/** API records use `_id`, shared types use `id` — read either. */
type RecordRef = string | { id?: string; _id?: string; name?: string };

function recordId(ref: RecordRef): string {
  if (typeof ref === 'string') return ref;
  return ref._id ?? ref.id ?? '';
}

function messNameOf(ref: RecordRef): string | undefined {
  if (typeof ref === 'string') return undefined;
  return ref.name;
}

const OPEN_COMPLAINT_STATUSES = ['submitted', 'acknowledged', 'in_progress'];

const PAYMENT_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
};

const QUICK_ACTIONS = [
  { name: 'View Menu', href: '/student/mess', icon: Utensils },
  { name: 'Pay Bill', href: '/student/payments', icon: CreditCard },
  { name: 'Raise Complaint', href: '/student/complaints/new', icon: MessageSquare },
  { name: 'My Room', href: '/student/room', icon: Home },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function MealItems({ items }: { items: MenuItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm italic">Not listed yet</p>;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`} className="flex items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
            )}
            title={item.isVeg ? 'Veg' : 'Non-veg'}
            aria-hidden="true"
          />
          <span className="text-foreground text-sm">{item.name}</span>
          {item.calories != null && (
            <span className="text-muted-foreground text-xs">{item.calories} kcal</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: profileData, isLoading: profileLoading } = useMyProfile();
  const { data: subsData, isLoading: subsLoading } = useMySubscriptions();
  const { data: billData, isLoading: billLoading, error: billError } = useMonthlyBill();
  const { data: complaintsData, isLoading: complaintsLoading } = useMyComplaints();
  const { data: paymentsData, isLoading: paymentsLoading } = useMyPayments();

  const activeSubscription = subsData?.subscriptions.find((sub) => sub.status === 'active');
  const activeMessId = activeSubscription ? recordId(activeSubscription.messId) : '';
  const { data: menuData, isLoading: menuLoading, error: menuError } = useMenuToday(activeMessId);

  const student = profileData?.student;
  const roomRef = student?.roomId;
  const roomNumber = roomRef && typeof roomRef !== 'string' ? roomRef.roomNumber : '—';
  const roomSub =
    roomRef && typeof roomRef !== 'string' ? `Floor ${roomRef.floor} · ${roomRef.type}` : undefined;
  const hostelName =
    student?.hostelId && typeof student.hostelId !== 'string' ? student.hostelId.name : undefined;

  const activePlan = activeSubscription
    ? prettyLabel(activeSubscription.plan)
    : subsLoading
      ? undefined
      : 'No active plan';
  const activeMessName = activeSubscription ? messNameOf(activeSubscription.messId) : undefined;

  const bill = billData?.bill;
  const openComplaints = complaintsData?.complaints.filter((complaint) =>
    OPEN_COMPLAINT_STATUSES.includes(complaint.status)
  ).length;

  const statsLoading = profileLoading || subsLoading || billLoading || complaintsLoading;
  const billDonut =
    bill && bill.paidThisMonth + bill.outstanding > 0
      ? [
          { name: 'Paid this month', value: bill.paidThisMonth, color: '#10b981' },
          { name: 'Outstanding', value: bill.outstanding, color: '#f43f5e' },
        ]
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">
            {greeting()}, {user?.name ?? 'there'} 👋
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {hostelName ? ` · ${hostelName}` : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Room"
          value={statsLoading ? <Skeleton className="h-7 w-16" /> : roomNumber}
          sub={roomSub}
          icon={Home}
        />
        <StatCard
          label="Active Mess Plan"
          value={statsLoading ? <Skeleton className="h-7 w-24" /> : activePlan}
          sub={activeMessName ?? (subsLoading ? undefined : 'Subscribe to a mess to get started')}
          icon={Utensils}
        />
        <StatCard
          label="This Month's Bill"
          value={
            billLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : bill ? (
              formatCurrency(bill.totalDue)
            ) : (
              '—'
            )
          }
          sub={bill?.month ? formatDate(`${bill.month}-01`) : undefined}
          icon={CreditCard}
        />
        <StatCard
          label="Open Complaints"
          value={
            complaintsLoading ? <Skeleton className="h-7 w-12" /> : String(openComplaints ?? 0)
          }
          sub={
            complaintsData
              ? `${complaintsData.complaints.length} total`
              : complaintsLoading
                ? undefined
                : 'Raise one if something needs fixing'
          }
          icon={MessageSquare}
        />
      </div>

      {/* Menu + Bill */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Menu */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Today's Menu</CardTitle>
            <Link
              to="/student/mess"
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
            >
              View mess <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {menuLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((section) => (
                  <div key={section} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : menuError ? (
              <EmptyState
                icon={Utensils}
                title="Couldn't load today's menu"
                description="Something went wrong while fetching the menu. Please try again."
              />
            ) : !menuData?.menu ||
              (menuData.menu.meals.breakfast.length === 0 &&
                menuData.menu.meals.lunch.length === 0 &&
                menuData.menu.meals.dinner.length === 0) ? (
              <EmptyState
                icon={Utensils}
                title="Menu not published yet"
                description="Your mess hasn't published a menu for today. Check back later."
              />
            ) : (
              <div className="space-y-5">
                <div>
                  <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Breakfast
                  </h4>
                  <MealItems items={menuData.menu.meals.breakfast} />
                </div>
                <div>
                  <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Lunch
                  </h4>
                  <MealItems items={menuData.menu.meals.lunch} />
                </div>
                <div>
                  <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Dinner
                  </h4>
                  <MealItems items={menuData.menu.meals.dinner} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Bill Breakdown</CardTitle>
            <Link
              to="/student/payments"
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
            >
              All payments <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {billLoading ? (
              <div className="space-y-3">
                <Skeleton className="mx-auto h-40 w-40 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : billError ? (
              <EmptyState
                icon={CreditCard}
                title="Couldn't load your bill"
                description="Something went wrong while fetching your monthly bill."
              />
            ) : !bill || bill.totalDue <= 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No bill for this month"
                description="Your dues for this month are all settled. 🎉"
              />
            ) : (
              <div className="space-y-4">
                {billDonut.length > 0 && (
                  <DonutChart
                    data={billDonut}
                    height={190}
                    centerLabel={
                      <div className="text-center">
                        <p className="text-foreground text-xl font-bold">
                          {formatCurrency(bill.totalDue)}
                        </p>
                        <p className="text-muted-foreground text-xs">Total due</p>
                      </div>
                    }
                  />
                )}
                <ul className="space-y-2">
                  {bill.items.map((item, index) => (
                    <li
                      key={`${item.label}-${index}`}
                      className="text-muted-foreground flex items-center justify-between text-sm"
                    >
                      <span>
                        {item.label}
                        {item.roomNumber ? ` · Room ${item.roomNumber}` : ''}
                        {item.messName ? ` · ${item.messName}` : ''}
                      </span>
                      <span className="text-foreground font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-border border-t pt-3">
                  <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <span>Paid this month</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(bill.paidThisMonth)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">Outstanding</span>
                    <span className="text-destructive font-semibold">
                      {formatCurrency(bill.outstanding)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Payments</CardTitle>
            <Link
              to="/student/payments"
              className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-10 w-full" />
                ))}
              </div>
            ) : !paymentsData || paymentsData.payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments yet"
                description="Your payment history will show up here once you make your first payment."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.payments.slice(0, 5).map((payment) => (
                    <TableRow key={recordId(payment)}>
                      <TableCell className="text-foreground font-medium">
                        {prettyLabel(payment.type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {prettyLabel(payment.method)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PAYMENT_STATUS_VARIANT[payment.status] ?? 'neutral'}>
                          {prettyLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.name} to={action.href} className="block">
                <div className="border-border hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                    <action.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="text-foreground flex-1 text-sm font-medium">{action.name}</span>
                  <ArrowRight className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
