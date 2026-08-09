'use client';

import { useState } from 'react';
import { Check, Inbox, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useAcceptSubscription,
  useMyMess,
  useRejectSubscription,
  useSubscriptionRequests,
} from '@/hooks';
import type { OwnerSubscription } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Label,
  Modal,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
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

function studentDetail(subscription: OwnerSubscription, field: 'studentId' | 'phone'): string {
  if (typeof subscription.studentId === 'string') return '—';
  return subscription.studentId[field] ?? '—';
}

export default function Requests() {
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const mess = profileData?.mess ?? null;

  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [rejecting, setRejecting] = useState<OwnerSubscription | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingData, isLoading: pendingLoading } = useSubscriptionRequests('pending');
  const { data: historyData, isLoading: historyLoading } = useSubscriptionRequests();
  const acceptSubscription = useAcceptSubscription();
  const rejectSubscription = useRejectSubscription();

  const pending = pendingData?.requests ?? [];
  const history = historyData?.requests ?? [];

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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Review and manage student subscription requests.</p>
        </div>
        <EmptyState
          icon={Users}
          title="Create your mess profile first"
          description="You need a mess profile before students can request subscriptions."
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
        <h1 className="text-foreground text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Review and manage student subscription requests.</p>
      </div>

      <Tabs
        tabs={[
          { id: 'pending', label: `Pending (${pendingData?.count ?? 0})` },
          { id: 'history', label: 'History' },
        ]}
        value={tab}
        onValueChange={(value) => setTab(value as 'pending' | 'history')}
      />

      {tab === 'pending' ? (
        pendingLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-40" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="Subscription requests from students will appear here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((request) => (
              <Card key={request._id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-foreground truncate font-medium">{studentName(request)}</p>
                      <p className="text-muted-foreground text-sm">
                        {studentDetail(request, 'studentId')} · {studentDetail(request, 'phone')}
                      </p>
                    </div>
                    <Badge variant="info">{prettyLabel(request.plan)}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Requested {formatDate(request.createdAt)}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptSubscription.mutate(request._id)}
                      isLoading={
                        acceptSubscription.isPending && acceptSubscription.variables === request._id
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
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : historyLoading ? (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2, 3].map((row) => (
                <TableRow key={row}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          description="All subscription requests will show up here once students apply."
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((request) => (
                <TableRow key={request._id}>
                  <TableCell className="text-foreground font-medium">
                    {studentName(request)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {studentDetail(request, 'studentId')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{prettyLabel(request.plan)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[request.status] ?? 'neutral'}>
                      {prettyLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
