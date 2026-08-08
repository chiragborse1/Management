import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Phone, Search, Star, Utensils } from 'lucide-react';
import { useMesses, useMySubscriptions, useRequestSubscription } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Mess, MessType, SubscriptionPlan } from '@shared/types';

type RefLike = string | { _id?: string; id?: string };

function refId(ref: RefLike | undefined | null): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : (ref._id ?? ref.id ?? '');
}

function messNameOf(ref: Mess | string | undefined | null): string {
  if (!ref || typeof ref === 'string') return '—';
  return ref.name;
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function fmtHours(hours: { start?: string; end?: string } | undefined): string {
  if (!hours?.start) return '—';
  return `${hours.start}–${hours.end ?? ''}`;
}

const PLAN_OPTIONS: ReadonlyArray<{ value: SubscriptionPlan; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-yearly' },
  { value: 'yearly', label: 'Yearly' },
];

/** Maps subscription plan values (snake_case) to numeric pricing keys (camelCase). */
const PLAN_PRICING_KEY: Record<
  SubscriptionPlan,
  'monthly' | 'quarterly' | 'halfYearly' | 'yearly'
> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  half_yearly: 'halfYearly',
  yearly: 'yearly',
};

const SUB_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  pending: 'warning',
  cancelled: 'neutral',
  expired: 'neutral',
  rejected: 'danger',
};

export default function MessPage() {
  const [tab, setTab] = useState('browse');
  const [typeFilter, setTypeFilter] = useState<MessType | ''>('');
  const [city, setCity] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');
  const [subscribeMess, setSubscribeMess] = useState<Mess | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | ''>('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(city.trim()), 300);
    return () => clearTimeout(timer);
  }, [city]);

  const {
    data: messesData,
    isLoading: messesLoading,
    error: messesError,
  } = useMesses({
    type: typeFilter === '' ? undefined : typeFilter,
    city: debouncedCity || undefined,
  });
  const { data: subsData, isLoading: subsLoading } = useMySubscriptions();
  const requestSub = useRequestSubscription();

  /** messId -> 'pending' | 'active' for messes the student already requested. */
  const messSubStatus = useMemo(() => {
    const map = new Map<string, string>();
    for (const sub of subsData?.subscriptions ?? []) {
      if (sub.status === 'pending' || sub.status === 'active') {
        const id = refId(sub.messId);
        if (id && !map.has(id)) map.set(id, sub.status);
      }
    }
    return map;
  }, [subsData?.subscriptions]);

  const handleSubscribe = () => {
    if (!subscribeMess || !plan) return;
    requestSub.mutate(
      { messId: refId(subscribeMess), plan },
      {
        // The hook already shows success/error toasts; close the modal here.
        onSuccess: () => {
          setSubscribeMess(null);
          setPlan('');
        },
      }
    );
  };

  const selectedPrice =
    subscribeMess && plan ? subscribeMess.pricing[PLAN_PRICING_KEY[plan]] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Mess</h1>
          <p className="text-muted-foreground">Browse messes and manage your subscription plans.</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'browse', label: 'Browse messes' },
          { id: 'my', label: 'My subscriptions' },
        ]}
        value={tab}
        onValueChange={setTab}
      />

      {tab === 'browse' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              label="Type"
              className="w-44"
              value={typeFilter}
              options={[
                { value: '', label: 'All messes' },
                { value: 'hostel', label: 'Hostel mess' },
                { value: 'outside', label: 'Outside mess' },
              ]}
              onChange={(value) => setTypeFilter(value as MessType | '')}
            />
            <div className="relative w-full sm:w-64">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Search by city"
                className="pl-9"
              />
            </div>
          </div>

          {messesLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Card key={item}>
                  <CardContent className="space-y-3 p-6">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : messesError ? (
            <EmptyState
              icon={Utensils}
              title="Couldn't load messes"
              description="Something went wrong while fetching the messes. Please try again."
            />
          ) : !messesData || messesData.messes.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No messes found"
              description="Try adjusting the filters or check back later."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {messesData.messes.map((mess) => {
                const status = messSubStatus.get(refId(mess));
                const pricingRows: ReadonlyArray<readonly [string, number]> = [
                  ['Monthly', mess.pricing.monthly],
                  ['Quarterly', mess.pricing.quarterly],
                  ['Half-yearly', mess.pricing.halfYearly],
                  ['Yearly', mess.pricing.yearly],
                ];
                return (
                  <Card key={refId(mess)} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="line-clamp-1">{mess.name}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {mess.city}
                          </CardDescription>
                        </div>
                        <Badge variant={mess.type === 'hostel' ? 'info' : 'neutral'}>
                          {mess.type === 'hostel' ? 'Hostel mess' : 'Outside mess'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      {mess.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {mess.description}
                        </p>
                      )}
                      {mess.cuisineTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {mess.cuisineTypes.map((cuisine) => (
                            <span
                              key={cuisine}
                              className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
                            >
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm">
                        <Star className="text-primary h-4 w-4 fill-current" aria-hidden="true" />
                        {mess.rating > 0 ? (
                          <span className="text-foreground font-medium">
                            {mess.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No ratings yet</span>
                        )}
                        {mess.totalReviews > 0 && (
                          <span className="text-muted-foreground">
                            ({mess.totalReviews} {mess.totalReviews === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
                      </div>
                      <ul className="divide-border border-border divide-y rounded-md border text-sm">
                        {pricingRows.map(([label, amount]) => (
                          <li key={label} className="flex items-center justify-between px-3 py-2">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="text-foreground font-medium">
                              {formatCurrency(amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />B{' '}
                        {fmtHours(mess.operatingHours.breakfast)} · L{' '}
                        {fmtHours(mess.operatingHours.lunch)} · D{' '}
                        {fmtHours(mess.operatingHours.dinner)}
                      </p>
                    </CardContent>
                    <CardFooter className="border-border mt-auto flex items-center justify-between gap-3 border-t pt-4">
                      {status ? (
                        <Badge variant={status === 'active' ? 'success' : 'warning'}>
                          {status === 'active' ? 'Subscribed' : 'Request pending'}
                        </Badge>
                      ) : mess.phone ? (
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {mess.phone}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Button
                        size="sm"
                        disabled={Boolean(status)}
                        onClick={() => {
                          setSubscribeMess(mess);
                          setPlan('');
                        }}
                      >
                        Subscribe
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : subsLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-16 w-full" />
          ))}
        </div>
      ) : !subsData || subsData.subscriptions.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No subscriptions yet"
          description="Browse messes and send a subscription request to get started."
          action={<Button onClick={() => setTab('browse')}>Browse messes</Button>}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Mess</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead className="text-right">End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsData.subscriptions.map((sub) => (
                <TableRow key={refId(sub)}>
                  <TableCell className="text-foreground font-medium">
                    {prettyLabel(sub.plan)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{messNameOf(sub.messId)}</TableCell>
                  <TableCell>
                    <Badge variant={SUB_STATUS_VARIANT[sub.status] ?? 'neutral'}>
                      {prettyLabel(sub.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.startDate ? formatDate(sub.startDate) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {sub.endDate ? formatDate(sub.endDate) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal
        open={subscribeMess !== null}
        onClose={() => {
          setSubscribeMess(null);
          setPlan('');
        }}
        title={subscribeMess ? `Subscribe to ${subscribeMess.name}` : 'Subscribe'}
        description="Pick a plan and we'll send your subscription request to the mess."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setSubscribeMess(null);
                setPlan('');
              }}
            >
              Cancel
            </Button>
            <Button isLoading={requestSub.isPending} disabled={!plan} onClick={handleSubscribe}>
              Send request
            </Button>
          </>
        }
      >
        <Select
          label="Plan"
          value={plan}
          placeholder="Select a plan"
          options={PLAN_OPTIONS.map((option) => ({
            value: option.value,
            label: subscribeMess
              ? `${option.label} · ${formatCurrency(subscribeMess.pricing[PLAN_PRICING_KEY[option.value]])}`
              : option.label,
          }))}
          onChange={(value) => setPlan(value as SubscriptionPlan | '')}
        />
        {plan && subscribeMess && (
          <p className="text-muted-foreground mt-3 text-sm">
            You'll pay {formatCurrency(selectedPrice ?? 0)} for the {prettyLabel(plan)} plan.
          </p>
        )}
      </Modal>
    </div>
  );
}
