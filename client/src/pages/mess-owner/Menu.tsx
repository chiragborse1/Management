'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDeleteMenu, useMessOwnerMenu, useMyMess, useUpsertMenu } from '@/hooks';
import type { MealsInput } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  Skeleton,
  Tabs,
} from '@/components/ui';
import { cn, generateId } from '@/lib/utils';
import type { DayOfWeek, Menu, MenuItem } from '@shared/types';

type MealKey = 'breakfast' | 'lunch' | 'dinner';

const MEAL_COLUMNS: { key: MealKey; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface DraftItem {
  key: string;
  name: string;
  isVeg: boolean;
}

type MealsDraft = Record<MealKey, DraftItem[]>;

const EMPTY_ADD_STATE: Record<MealKey, { name: string; isVeg: boolean }> = {
  breakfast: { name: '', isVeg: true },
  lunch: { name: '', isVeg: true },
  dinner: { name: '', isVeg: true },
};

function emptyDraft(): MealsDraft {
  return { breakfast: [], lunch: [], dinner: [] };
}

function draftFromMenu(menu: Pick<Menu, 'meals'> | undefined): MealsDraft {
  const toDraft = (items: MenuItem[]): DraftItem[] =>
    items.map((item) => ({ key: item.id, name: item.name, isVeg: item.isVeg }));
  return {
    breakfast: toDraft(menu?.meals.breakfast ?? []),
    lunch: toDraft(menu?.meals.lunch ?? []),
    dinner: toDraft(menu?.meals.dinner ?? []),
  };
}

function draftToMeals(draft: MealsDraft): MealsInput {
  const toInput = (items: DraftItem[]): MealsInput['breakfast'] =>
    items.map(({ name, isVeg }) => ({ name, isVeg }));
  return {
    breakfast: toInput(draft.breakfast),
    lunch: toInput(draft.lunch),
    dinner: toInput(draft.dinner),
  };
}

export default function Menu() {
  const { data: profileData, isLoading: profileLoading } = useMyMess();
  const mess = profileData?.mess ?? null;
  const messId = mess?._id ?? mess?.id ?? '';

  const { data: menuData, isLoading: menuLoading } = useMessOwnerMenu(messId);
  const upsertMenu = useUpsertMenu();
  const deleteMenu = useDeleteMenu();

  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [draft, setDraft] = useState<MealsDraft>(emptyDraft);
  const [dirty, setDirty] = useState(false);
  const [addState, setAddState] = useState(EMPTY_ADD_STATE);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menus = useMemo(() => menuData?.menus ?? [], [menuData]);
  const existingMenu = menus.find((menu) => menu.dayOfWeek === activeDay);
  const hasExistingMenu = Boolean(existingMenu);

  // Load the active day's items from the fetched week menu (skipped while editing).
  useEffect(() => {
    if (dirty) return;
    const menu = menus.find((entry) => entry.dayOfWeek === activeDay);
    setDraft(draftFromMenu(menu));
  }, [activeDay, menus, dirty]);

  function handleDayChange(day: string): void {
    setDirty(false);
    setActiveDay(day as DayOfWeek);
  }

  function handleAddItem(meal: MealKey): void {
    const name = addState[meal].name.trim();
    if (!name) return;
    setDraft((current) => ({
      ...current,
      [meal]: [...current[meal], { key: generateId(), name, isVeg: addState[meal].isVeg }],
    }));
    setAddState((current) => ({ ...current, [meal]: { name: '', isVeg: true } }));
    setDirty(true);
  }

  function handleRemoveItem(meal: MealKey, key: string): void {
    setDraft((current) => ({
      ...current,
      [meal]: current[meal].filter((item) => item.key !== key),
    }));
    setDirty(true);
  }

  function handleToggleVeg(meal: MealKey, key: string): void {
    setDraft((current) => ({
      ...current,
      [meal]: current[meal].map((item) =>
        item.key === key ? { ...item, isVeg: !item.isVeg } : item
      ),
    }));
    setDirty(true);
  }

  function handleSave(isPublished: boolean): void {
    upsertMenu.mutate({ dayOfWeek: activeDay, meals: draftToMeals(draft), isPublished });
    setDirty(false);
  }

  function handleDelete(): void {
    deleteMenu.mutate(activeDay);
    setConfirmDelete(false);
    setDirty(false);
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!mess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Weekly Menu</h1>
          <p className="text-muted-foreground">Plan and publish your menu for the week.</p>
        </div>
        <EmptyState
          icon={Utensils}
          title="Create your mess profile first"
          description="You need a mess profile before you can manage a weekly menu."
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
        <h1 className="text-foreground text-2xl font-bold">Weekly Menu</h1>
        <p className="text-muted-foreground">
          Edit each day's meals, then save as a draft or publish to notify subscribers.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <Tabs
          tabs={DAYS.map((day) => ({ id: day.value, label: day.label }))}
          value={activeDay}
          onValueChange={handleDayChange}
        />
      </div>

      {menuLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {MEAL_COLUMNS.map(({ key, label }) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {draft[key].length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items yet.</p>
                  ) : (
                    draft[key].map((item) => (
                      <div
                        key={item.key}
                        className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleVeg(key, item.key)}
                            title={item.isVeg ? 'Veg item' : 'Non-veg item'}
                            aria-label={`Toggle veg for ${item.name}`}
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold',
                              item.isVeg
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-red-500 bg-red-500 text-white'
                            )}
                          >
                            {item.isVeg ? 'V' : 'N'}
                          </button>
                          <span className="text-foreground truncate text-sm">{item.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(key, item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={addState[key].name}
                      onChange={(event) =>
                        setAddState((current) => ({
                          ...current,
                          [key]: { ...current[key], name: event.target.value },
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddItem(key);
                        }
                      }}
                      placeholder={`Add ${label.toLowerCase()} item`}
                      className="h-9"
                      aria-label={`New ${label.toLowerCase()} item name`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddItem(key)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => handleSave(false)} isLoading={upsertMenu.isPending}>
              Save Day
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(true)}
              isLoading={upsertMenu.isPending}
            >
              Save &amp; Publish
            </Button>
            {hasExistingMenu && (
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:text-destructive"
              >
                Delete Day
              </Button>
            )}
          </div>

          {existingMenu?.isPublished && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <Badge variant="success">Published</Badge>
              This day's menu is live for subscribers.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this day's menu?"
        description={`This will permanently remove the ${DAY_LABELS[activeDay]} menu for your mess.`}
        confirmLabel="Delete"
        isLoading={deleteMenu.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
