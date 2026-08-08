'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { CreditCard, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePayment, useMonthlyBill, useMyPayments } from '@/hooks';
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
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/lib/types';
import type { PaymentMethod } from '@shared/types';

type PaymentStatusBadge = 'success' | 'warning' | 'danger' | 'neutral';

const PAYMENT_STATUS_VARIANT: Record<string, PaymentStatusBadge> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'neutral',
};

const PAYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'room_rent', label: 'Room Rent' },
  { value: 'mess_subscription', label: 'Mess Subscription' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'net_banking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
];

/** API records use `_id`, shared types use `id` — read either. */
function recordId(record: { id?: string; _id?: string }): string {
  return record._id ?? record.id ?? '';
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Payments() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<Payment['type'] | ''>('');
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: billData, isLoading: billLoading, error: billError } = useMonthlyBill();
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useMyPayments({
    page,
    limit: 10,
  });
  const createPayment = useCreatePayment();

  const bill = billData?.bill;
  const payments = paymentsData?.payments ?? [];
  const pagination = paymentsData?.pagination;

  function resetForm(): void {
    setType('');
    setMethod('');
    setAmount('');
    setDescription('');
  }

  function closeModal(): void {
    setIsModalOpen(false);
    resetForm();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!type) {
      toast.error('Select a payment type');
      return;
    }
    if (!method) {
      toast.error('Select a payment method');
      return;
    }
    const parsedAmount = Number(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    createPayment.mutate(
      {
        type,
        amount: parsedAmount,
        method,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          closeModal();
          toast.success('Payment recorded (pending approval)');
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Track your monthly bill and record payments against your account.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
        >
          Pay Now
        </Button>
      </div>

      {/* Monthly bill */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>This Month's Bill</CardTitle>
            <CardDescription>
              {bill?.month
                ? `Billing period · ${formatDate(`${bill.month}-01`)}`
                : 'Your monthly dues'}
            </CardDescription>
          </div>
          <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <ReceiptText className="h-5 w-5" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          {billLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-5 w-full" />
              ))}
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : billError ? (
            <EmptyState
              icon={ReceiptText}
              title="Couldn't load your bill"
              description="Something went wrong while fetching your monthly bill. Please try again."
            />
          ) : !bill || bill.totalDue <= 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No bill for this month"
              description="Your dues for this month are all settled. 🎉"
            />
          ) : (
            <div className="space-y-4">
              <ul className="space-y-2">
                {bill.items.map((item, index) => (
                  <li
                    key={`${item.label}-${index}`}
                    className="text-muted-foreground flex items-center justify-between gap-2 text-sm"
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
              <div className="border-border space-y-1.5 border-t pt-3">
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                  <span>Paid this month</span>
                  <span className="text-primary font-medium">
                    {formatCurrency(bill.paidThisMonth)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">Outstanding</span>
                  <span className="text-destructive font-semibold">
                    {formatCurrency(bill.outstanding)}
                  </span>
                </div>
              </div>
              <div className="bg-muted flex items-center justify-between rounded-md px-4 py-3">
                <span className="text-foreground text-sm font-medium">Total due</span>
                <span className="text-foreground text-lg font-bold">
                  {formatCurrency(bill.totalDue)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Every payment you've made, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </div>
          ) : paymentsError ? (
            <EmptyState
              icon={CreditCard}
              title="Couldn't load payments"
              description="Something went wrong while fetching your payment history. Please try again."
            />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Your payment history will show up here once you make your first payment."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={recordId(payment)}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {prettyLabel(payment.type)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
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
                      <TableCell className="text-muted-foreground max-w-[10rem] truncate">
                        {payment.transactionId ?? '—'}
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

      {/* Pay now modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title="Make a Payment"
        description="Record a payment against your account. It will be verified by the admin."
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="payment-form"
              isLoading={createPayment.isPending}
              leftIcon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Payment type"
            placeholder="Select a type"
            options={PAYMENT_TYPE_OPTIONS}
            value={type}
            onChange={(value) => setType(value as Payment['type'])}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 5000"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <Select
              label="Payment method"
              placeholder="Select a method"
              options={PAYMENT_METHOD_OPTIONS}
              value={method}
              onChange={(value) => setMethod(value as PaymentMethod)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment-description">Description (optional)</Label>
            <Input
              id="payment-description"
              placeholder="e.g. March room rent"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
