import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMyProfile, useUpdateProfile } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { getInitials } from '@/lib/utils';
import type { UpdateProfileInput } from '@/lib/types';

const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(PHONE_PATTERN, 'Enter a valid phone (10–15 digits, optional +)'),
  avatar: z.union([z.string().url('Enter a valid image URL'), z.literal('')]).optional(),
  address: z.string().optional(),
  parentPhone: z
    .union([
      z.string().regex(PHONE_PATTERN, 'Enter a valid phone (10–15 digits, optional +)'),
      z.literal(''),
    ])
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z
    .union([
      z.string().regex(PHONE_PATTERN, 'Enter a valid phone (10–15 digits, optional +)'),
      z.literal(''),
    ])
    .optional(),
  emergencyContactRelation: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { data: profileData, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const student = profileData?.student;

  const defaults = useMemo<ProfileFormValues>(
    () => ({
      name: student?.name ?? '',
      phone: student?.phone ?? '',
      avatar: student?.avatar ?? '',
      address: student?.address ?? '',
      parentPhone: student?.parentPhone ?? '',
      emergencyContactName: student?.emergencyContact?.name ?? '',
      emergencyContactPhone: student?.emergencyContact?.phone ?? '',
      emergencyContactRelation: student?.emergencyContact?.relation ?? '',
    }),
    [student]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: defaults,
  });

  const onSubmit = (values: ProfileFormValues) => {
    const payload: UpdateProfileInput = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      avatar: values.avatar?.trim() || undefined,
      address: values.address?.trim() || undefined,
      parentPhone: values.parentPhone?.trim() || undefined,
    };
    const hasEmergency =
      values.emergencyContactName?.trim() ||
      values.emergencyContactPhone?.trim() ||
      values.emergencyContactRelation?.trim();
    if (hasEmergency) {
      payload.emergencyContact = {
        name: values.emergencyContactName?.trim() ?? '',
        phone: values.emergencyContactPhone?.trim() ?? '',
        relation: values.emergencyContactRelation?.trim() ?? '',
      };
    }
    // The hook shows success/error toasts and invalidates the profile query.
    updateProfile.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile details.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-16 rounded-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : student ? (
              <>
                <div className="flex items-center gap-4">
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="bg-muted h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 text-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold">
                      {getInitials(student.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-foreground flex items-center gap-2 text-lg font-semibold">
                      <span className="truncate">{student.name}</span>
                      <Badge>Student</Badge>
                    </p>
                    <p className="text-muted-foreground truncate text-sm">{student.email}</p>
                  </div>
                </div>
                <div className="border-border space-y-2 border-t pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Student ID</span>
                    <span className="text-foreground font-medium">{student.studentId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground font-medium">{student.email}</span>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your contact details. Fields marked with an asterisk are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  void handleSubmit(onSubmit)(event);
                }}
                className="space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Full name *" error={errors.name?.message}>
                    <Input placeholder="Your name" {...register('name')} />
                  </FormField>
                  <FormField label="Phone *" error={errors.phone?.message}>
                    <Input placeholder="+91 98765 43210" inputMode="tel" {...register('phone')} />
                  </FormField>
                </div>

                <FormField label="Avatar URL" error={errors.avatar?.message}>
                  <Input
                    placeholder="https://example.com/avatar.jpg"
                    inputMode="url"
                    {...register('avatar')}
                  />
                </FormField>

                <FormField label="Address" error={errors.address?.message}>
                  <Textarea
                    rows={2}
                    placeholder="e.g. 42, MG Road, Bengaluru"
                    {...register('address')}
                  />
                </FormField>

                <FormField label="Parent's phone" error={errors.parentPhone?.message}>
                  <Input
                    placeholder="+91 98765 43210"
                    inputMode="tel"
                    {...register('parentPhone')}
                  />
                </FormField>

                <div className="border-border space-y-4 border-t pt-4">
                  <p className="text-foreground text-sm font-semibold">Emergency contact</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField label="Name" error={errors.emergencyContactName?.message}>
                      <Input placeholder="Guardian name" {...register('emergencyContactName')} />
                    </FormField>
                    <FormField label="Phone" error={errors.emergencyContactPhone?.message}>
                      <Input
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                        {...register('emergencyContactPhone')}
                      />
                    </FormField>
                    <FormField label="Relation" error={errors.emergencyContactRelation?.message}>
                      <Input placeholder="e.g. Father" {...register('emergencyContactRelation')} />
                    </FormField>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={updateProfile.isPending}>
                    Save changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
