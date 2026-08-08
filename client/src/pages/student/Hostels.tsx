import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from '@/components/ui';

/**
 * Hostel documents returned by GET /api/hostels (Mongoose docs use `_id`).
 * The schema stores amenities/images but not `totalRooms`/`rating`, so those
 * are kept optional and rendered defensively.
 */
interface HostelRecord {
  _id?: string;
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  totalRooms?: number;
  amenities?: string[];
  images?: string[];
  rating?: number;
  isActive?: boolean;
}

interface HostelsPayload {
  hostels?: HostelRecord[];
  data?: { hostels?: HostelRecord[] };
}

function hostelKey(hostel: HostelRecord): string {
  return hostel._id ?? `${hostel.name}-${hostel.city}`;
}

export default function HostelsPage() {
  const {
    data: hostels,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['hostels'],
    queryFn: async () => {
      // The hostel controller responds with { hostels, pagination } directly
      // (it uses res.json, not the sendSuccess envelope). Tolerate a wrapped
      // { success, data: { hostels } } shape too for forward compatibility.
      const response = await apiClient.get<HostelsPayload>('/hostels');
      return response.data.hostels ?? response.data.data?.hostels ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Hostels</h1>
          <p className="text-muted-foreground">
            Browse the hostels in your network and their amenities.
          </p>
        </div>
      </div>

      {isLoading ? (
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
      ) : error ? (
        <EmptyState
          icon={Building2}
          title="Couldn't load hostels"
          description="Something went wrong while fetching the hostels. Please try again."
        />
      ) : !hostels || hostels.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No hostels available"
          description="New hostels will appear here once they're added."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => (
            <Card key={hostelKey(hostel)} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="line-clamp-1">{hostel.name ?? 'Unnamed hostel'}</CardTitle>
                  {hostel.rating != null && hostel.rating > 0 && (
                    <Badge className="shrink-0 gap-1">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      {hostel.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {[hostel.city, hostel.state].filter(Boolean).join(', ') || 'Location unavailable'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                {hostel.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">{hostel.description}</p>
                )}
                {hostel.amenities && hostel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {hostel.amenities.slice(0, 6).map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {hostel.amenities.length > 6 && (
                      <span className="text-muted-foreground text-xs">
                        +{hostel.amenities.length - 6} more
                      </span>
                    )}
                  </div>
                )}
                <div className="border-border mt-auto space-y-1.5 border-t pt-3 text-sm">
                  {hostel.totalRooms != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total rooms</span>
                      <span className="text-foreground font-medium">{hostel.totalRooms}</span>
                    </div>
                  )}
                  {hostel.phone && (
                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {hostel.phone}
                    </p>
                  )}
                  {hostel.address && (
                    <p className="text-muted-foreground line-clamp-1">{hostel.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
