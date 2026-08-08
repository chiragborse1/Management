import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { BedDouble, Building2, DoorOpen, IndianRupee, Layers } from 'lucide-react';
import { useMyRoom } from '@/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  StatCard,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

/** Room document from GET /api/students/me/room (Mongoose doc: _id based). */
interface RoomRecord {
  roomNumber?: string;
  floor?: number;
  type?: string;
  capacity?: number;
  rentPerMonth?: number;
  depositAmount?: number;
  amenities?: string[];
  hostelId?: { name?: string; address?: string; city?: string } | string;
}

function prettyLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

export default function MyRoomPage() {
  const { data, isLoading, error } = useMyRoom();
  const room: RoomRecord | null = data?.room ?? null;
  const allocation = data?.allocation ?? null;
  const hostel = room && typeof room.hostelId === 'object' ? room.hostelId : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">My Room</h1>
          <p className="text-muted-foreground">Your current accommodation details.</p>
        </div>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Room Number" value={<Skeleton className="h-7 w-16" />} />
            <StatCard label="Floor" value={<Skeleton className="h-7 w-12" />} />
            <StatCard label="Room Type" value={<Skeleton className="h-7 w-24" />} />
            <StatCard label="Rent / Month" value={<Skeleton className="h-7 w-24" />} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </>
      ) : error ? (
        <EmptyState
          icon={DoorOpen}
          title="Couldn't load your room"
          description="Something went wrong while fetching your room details. Please try again."
        />
      ) : !room ? (
        <EmptyState
          icon={DoorOpen}
          title="No room allocated yet"
          description="You don't have a room assigned yet. Browse hostels to find your accommodation."
          action={
            <Link to="/student/hostels">
              <Button>Browse hostels</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Room Number"
              value={room.roomNumber ?? '—'}
              sub={hostel?.name}
              icon={DoorOpen}
            />
            <StatCard
              label="Floor"
              value={room.floor != null ? String(room.floor) : '—'}
              icon={Layers}
            />
            <StatCard label="Room Type" value={prettyLabel(room.type ?? '—')} icon={BedDouble} />
            <StatCard
              label="Rent / Month"
              value={room.rentPerMonth != null ? formatCurrency(room.rentPerMonth) : '—'}
              sub={
                room.depositAmount != null
                  ? `Deposit ${formatCurrency(room.depositAmount)}`
                  : undefined
              }
              icon={IndianRupee}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Capacity"
                    value={
                      room.capacity != null
                        ? `${room.capacity} ${room.capacity === 1 ? 'person' : 'people'}`
                        : '—'
                    }
                  />
                  <DetailItem
                    label="Deposit"
                    value={room.depositAmount != null ? formatCurrency(room.depositAmount) : '—'}
                  />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Amenities
                  </p>
                  {room.amenities && room.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">—</p>
                  )}
                </div>
                {hostel && (
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Hostel
                    </p>
                    <p className="text-foreground text-sm font-medium">{hostel.name ?? '—'}</p>
                    {(hostel.address || hostel.city) && (
                      <p className="text-muted-foreground text-sm">
                        {[hostel.address, hostel.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocation</CardTitle>
                <CardDescription>Your current room allotment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <Badge variant="success">Active</Badge>
                </div>
                {allocation?.allocatedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Allocated on</span>
                    <span className="text-foreground text-sm font-medium">
                      {formatDate(allocation.allocatedAt)}
                    </span>
                  </div>
                )}
                {!allocation?.allocatedAt && (
                  <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Allocation record unavailable.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
