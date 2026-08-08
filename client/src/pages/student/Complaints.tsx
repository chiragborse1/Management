'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateComplaint, useMyComplaints, useMyProfile } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Complaint, ComplaintCategory, ComplaintPriority } from '@shared/types';
import type { PopulatedHostelRef } from '@shared/types/api';

type PriorityBadge = 'neutral' | 'info' | 'warning' | 'danger';
type StatusBadge = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'food_quality', label: 'Food Quality' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'internet', label: 'Internet' },
  { value: 'security', label: 'Security' },
  { value: 'noise', label: 'Noise' },
  { value: 'roommate', label: 'Roommate' },
  { value: 'mess_service', label: 'Mess Service' },
  { value: 'billing', label: 'Billing' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_VARIANT: Record<string, PriorityBadge> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const STATUS_VARIANT: Record<string, StatusBadge> = {
  submitted: 'info',
  acknowledged: 'warning',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
  rejected: 'danger',
};

/** API records use `_id`, shared types use `id` — read either. */
function recordId(record: { id?: string; _id?: string }): string {
  return record._id ?? record.id ?? '';
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/** The profile may return a populated hostel object or a bare id. */
function resolveHostelId(hostelRef: string | PopulatedHostelRef | undefined): string {
  if (!hostelRef) return '';
  if (typeof hostelRef === 'string') return hostelRef;
  const populated = hostelRef as { _id?: string; id?: string };
  return populated._id ?? populated.id ?? '';
}

export default function Complaints() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Complaint | null>(null);

  const { data: complaintsData, isLoading, error } = useMyComplaints({ page, limit: 10 });
  const { data: profileData } = useMyProfile();
  const createComplaint = useCreateComplaint();

  const complaints = complaintsData?.complaints ?? [];
  const pagination = complaintsData?.pagination;
  const hostelId = resolveHostelId(profileData?.student?.hostelId);

  function resetForm(): void {
    setCategory('');
    setTitle('');
    setDescription('');
  }

  function closeModal(): void {
    setIsModalOpen(false);
    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!hostelId) {
      toast.error('No hostel assigned — contact admin');
      return;
    }
    if (!category) {
      toast.error('Select a category');
      return;
    }
    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    createComplaint.mutate(
      {
        hostelId,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">
            Raise issues with your hostel and follow their progress.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
        >
          Raise Complaint
        </Button>
      </div>

      {/* Complaints table */}
      <Card>
        <CardHeader>
          <CardTitle>My Complaints</CardTitle>
          <CardDescription>
            Click a complaint to see its full details and latest status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={MessageSquare}
              title="Couldn't load complaints"
              description="Something went wrong while fetching your complaints. Please try again."
            />
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No complaints yet"
              description="Nothing to report — or raise one if something needs fixing."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow
                      key={recordId(complaint)}
                      className="cursor-pointer"
                      onClick={() => setSelected(complaint)}
                    >
                      <TableCell className="text-foreground max-w-[16rem] truncate font-medium">
                        {complaint.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{prettyLabel(complaint.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORITY_VARIANT[complaint.priority] ?? 'neutral'}>
                          {prettyLabel(complaint.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[complaint.status] ?? 'neutral'}>
                          {prettyLabel(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(complaint.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination && pagination.pages > 1 && (
                <Pagination
                  page={pagination.page}
                  pages={pagination.pages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raise complaint modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Raise a Complaint"
        description="Tell us what's wrong — the admin will be notified right away."
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="complaint-form"
              isLoading={createComplaint.isPending}
              leftIcon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
            >
              Submit Complaint
            </Button>
          </>
        }
      >
        <form id="complaint-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              placeholder="Select a category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(value) => setCategory(value as ComplaintCategory)}
            />
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(value) => setPriority(value as ComplaintPriority)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complaint-title">Title</Label>
            <Input
              id="complaint-title"
              placeholder="e.g. Leaking tap in washroom"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complaint-description">Description</Label>
            <Textarea
              id="complaint-description"
              placeholder="Describe the issue in detail, including location and when it started."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Complaint detail modal */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? 'Complaint'}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{prettyLabel(selected.category)}</Badge>
              <Badge variant={PRIORITY_VARIANT[selected.priority] ?? 'neutral'}>
                {prettyLabel(selected.priority)} priority
              </Badge>
              <Badge variant={STATUS_VARIANT[selected.status] ?? 'neutral'}>
                {prettyLabel(selected.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{selected.description}</p>
            <div className="border-border text-muted-foreground space-y-1 border-t pt-3 text-sm">
              <p>
                Raised on{' '}
                <span className="text-foreground">{formatDateTime(selected.createdAt)}</span>
              </p>
              <p>
                Last updated{' '}
                <span className="text-foreground">{formatDateTime(selected.updatedAt)}</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
