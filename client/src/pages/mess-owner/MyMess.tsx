'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MapPin, Phone, Star, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateMess, useMyMess, useUpdateMess } from '@/hooks';
import type { MessOwnerProfileInput } from '@/hooks';
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
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import type { Mess, MessType } from '@shared/types';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'hostel', label: 'Hostel Mess' },
  { value: 'outside', label: 'Outside Mess' },
];

interface ProfileForm {
  name: string;
  description: string;
  type: MessType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  cuisineTypes: string;
  monthly: string;
  quarterly: string;
  halfYearly: string;
  yearly: string;
  breakfastStart: string;
  breakfastEnd: string;
  lunchStart: string;
  lunchEnd: string;
  dinnerStart: string;
  dinnerEnd: string;
  isActive: boolean;
}

const EMPTY_FORM: ProfileForm = {
  name: '',
  description: '',
  type: 'hostel',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  cuisineTypes: '',
  monthly: '',
  quarterly: '',
  halfYearly: '',
  yearly: '',
  breakfastStart: '07:30',
  breakfastEnd: '09:30',
  lunchStart: '12:00',
  lunchEnd: '14:00',
  dinnerStart: '19:00',
  dinnerEnd: '21:00',
  isActive: true,
};

function formFromMess(mess: Mess): ProfileForm {
  return {
    name: mess.name,
    description: mess.description,
    type: mess.type,
    address: mess.address,
    city: mess.city,
    state: mess.state,
    pincode: mess.pincode,
    phone: mess.phone,
    email: mess.email,
    cuisineTypes: mess.cuisineTypes.join(', '),
    monthly: mess.pricing.monthly ? String(mess.pricing.monthly) : '',
    quarterly: mess.pricing.quarterly ? String(mess.pricing.quarterly) : '',
    halfYearly: mess.pricing.halfYearly ? String(mess.pricing.halfYearly) : '',
    yearly: mess.pricing.yearly ? String(mess.pricing.yearly) : '',
    breakfastStart: mess.operatingHours.breakfast.start,
    breakfastEnd: mess.operatingHours.breakfast.end,
    lunchStart: mess.operatingHours.lunch.start,
    lunchEnd: mess.operatingHours.lunch.end,
    dinnerStart: mess.operatingHours.dinner.start,
    dinnerEnd: mess.operatingHours.dinner.end,
    isActive: mess.isActive,
  };
}

function formToPayload(form: ProfileForm): MessOwnerProfileInput {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    type: form.type,
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    cuisineTypes: form.cuisineTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    images: [],
    pricing: {
      monthly: Number(form.monthly) || 0,
      quarterly: Number(form.quarterly) || 0,
      halfYearly: Number(form.halfYearly) || 0,
      yearly: Number(form.yearly) || 0,
    },
    operatingHours: {
      breakfast: { start: form.breakfastStart, end: form.breakfastEnd },
      lunch: { start: form.lunchStart, end: form.lunchEnd },
      dinner: { start: form.dinnerStart, end: form.dinnerEnd },
    },
    isActive: form.isActive,
  };
}

export default function MyMess() {
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const createMess = useCreateMess();
  const updateMess = useUpdateMess();

  const mess = profileData?.mess ?? null;
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  // Prefill whenever the profile loads or changes (create → edit switch).
  useEffect(() => {
    if (mess) setForm(formFromMess(mess));
  }, [mess]);

  function updateField<K extends keyof ProfileForm>(field: K, value: ProfileForm[K]): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const required = [
      form.name,
      form.address,
      form.city,
      form.state,
      form.pincode,
      form.phone,
      form.email,
    ];
    if (required.some((value) => !value.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }
    const payload = formToPayload(form);
    if (mess) {
      updateMess.mutate(payload);
    } else {
      createMess.mutate(payload);
    }
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[480px] lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Mess Profile</h1>
        <p className="text-muted-foreground">
          {mess
            ? 'Update your mess details — students see these live.'
            : 'Set up your mess to start taking subscriptions.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{mess ? 'Edit Details' : 'Create Your Mess'}</CardTitle>
            <CardDescription>
              Fields marked * are required. Pricing and hours are shown to students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mess-name">Name *</Label>
                  <Input
                    id="mess-name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="e.g. Annapurna Mess"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-type">Type *</Label>
                  <Select
                    id="mess-type"
                    value={form.type}
                    onChange={(value) => updateField('type', value as MessType)}
                    options={TYPE_OPTIONS}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-cuisines">Cuisines (comma separated)</Label>
                  <Input
                    id="mess-cuisines"
                    value={form.cuisineTypes}
                    onChange={(event) => updateField('cuisineTypes', event.target.value)}
                    placeholder="North Indian, South Indian, Jain"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mess-description">Description</Label>
                  <Textarea
                    id="mess-description"
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    placeholder="Tell students what makes your mess special"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mess-address">Address *</Label>
                  <Input
                    id="mess-address"
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Street, area, landmark"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-city">City *</Label>
                  <Input
                    id="mess-city"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-state">State *</Label>
                  <Input
                    id="mess-state"
                    value={form.state}
                    onChange={(event) => updateField('state', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-pincode">Pincode *</Label>
                  <Input
                    id="mess-pincode"
                    value={form.pincode}
                    onChange={(event) => updateField('pincode', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mess-phone">Phone *</Label>
                  <Input
                    id="mess-phone"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="mess-email">Email *</Label>
                  <Input
                    id="mess-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                  />
                </div>
              </div>

              <div className="border-border space-y-3 rounded-lg border p-4">
                <p className="text-foreground text-sm font-medium">Pricing (₹ per student)</p>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price-monthly">Monthly</Label>
                    <Input
                      id="price-monthly"
                      type="number"
                      min="0"
                      value={form.monthly}
                      onChange={(event) => updateField('monthly', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-quarterly">Quarterly</Label>
                    <Input
                      id="price-quarterly"
                      type="number"
                      min="0"
                      value={form.quarterly}
                      onChange={(event) => updateField('quarterly', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-half-yearly">Half Yearly</Label>
                    <Input
                      id="price-half-yearly"
                      type="number"
                      min="0"
                      value={form.halfYearly}
                      onChange={(event) => updateField('halfYearly', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price-yearly">Yearly</Label>
                    <Input
                      id="price-yearly"
                      type="number"
                      min="0"
                      value={form.yearly}
                      onChange={(event) => updateField('yearly', event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-border space-y-3 rounded-lg border p-4">
                <p className="text-foreground text-sm font-medium">Operating Hours</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ['Breakfast', 'breakfastStart', 'breakfastEnd'],
                      ['Lunch', 'lunchStart', 'lunchEnd'],
                      ['Dinner', 'dinnerStart', 'dinnerEnd'],
                    ] as const
                  ).map(([label, startKey, endKey]) => (
                    <div key={label} className="space-y-1.5">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={form[startKey]}
                          onChange={(event) => updateField(startKey, event.target.value)}
                          aria-label={`${label} start time`}
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={form[endKey]}
                          onChange={(event) => updateField(endKey, event.target.value)}
                          aria-label={`${label} end time`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField('isActive', event.target.checked)}
                  className="border-border accent-primary h-4 w-4 rounded"
                />
                <span className="text-foreground text-sm font-medium">
                  Accepting new subscriptions
                </span>
              </label>

              <div className="flex justify-end">
                <Button type="submit" isLoading={createMess.isPending || updateMess.isPending}>
                  {mess ? 'Save Changes' : 'Create Mess Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {mess && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="text-primary h-5 w-5" aria-hidden="true" />
                  {mess.name}
                </CardTitle>
                <CardDescription>
                  <Badge variant="info">
                    {mess.type === 'hostel' ? 'Hostel Mess' : 'Outside Mess'}
                  </Badge>{' '}
                  <Badge variant={mess.isActive ? 'success' : 'neutral'}>
                    {mess.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="text-foreground font-medium">{mess.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">{mess.totalReviews} reviews</span>
                </div>
                <div className="text-muted-foreground flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {mess.address}, {mess.city}, {mess.state} {mess.pincode}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{mess.phone}</span>
                </div>
                {mess.cuisineTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mess.cuisineTypes.map((cuisine) => (
                      <Badge key={cuisine} variant="neutral">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
