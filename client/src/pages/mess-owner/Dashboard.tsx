'use client';

import {
  Utensils,
  Users,
  Star,
  TrendingUp,
  Wallet,
  Calendar,
  DollarSign,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const messOwnerStats = [
  {
    name: 'Total Subscribers',
    value: '156',
    change: '+12%',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    name: 'Monthly Revenue',
    value: formatCurrency(485000),
    change: '+18%',
    icon: Wallet,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    name: 'Average Rating',
    value: '4.6',
    change: '+0.2',
    icon: Star,
    color: 'text-yellow-500 bg-yellow-500/10',
  },
  {
    name: 'Active Menu',
    value: 'Week 41',
    icon: Calendar,
    color: 'text-purple-500 bg-purple-500/10',
  },
];

const recentReviews = [
  {
    id: '1',
    student: 'Rahul S.',
    rating: 5,
    comment: 'Excellent food quality and variety!',
    date: 'Oct 1, 2024',
  },
  {
    id: '2',
    student: 'Priya M.',
    rating: 4,
    comment: 'Good taste but lunch could be better.',
    date: 'Sep 28, 2024',
  },
  {
    id: '3',
    student: 'Amit K.',
    rating: 5,
    comment: 'Best mess in the area, highly recommended.',
    date: 'Sep 25, 2024',
  },
  {
    id: '4',
    student: 'Sneha P.',
    rating: 3,
    comment: 'Average. Dinner timing needs improvement.',
    date: 'Sep 22, 2024',
  },
];

const pendingRequests = [
  { id: '1', student: 'Vikram R.', room: 'Room 203', plan: 'Monthly', date: 'Oct 2, 2024' },
  { id: '2', student: 'Kavya S.', room: 'Room 105', plan: 'Quarterly', date: 'Oct 1, 2024' },
  { id: '3', student: 'Arjun M.', room: 'Room 312', plan: 'Monthly', date: 'Sep 30, 2024' },
];

const weeklyMenu = [
  {
    day: 'Monday',
    breakfast: 'Idli Sambar',
    lunch: 'Rice, Dal, Aloo Gobi',
    dinner: 'Roti, Paneer Butter Masala',
  },
  {
    day: 'Tuesday',
    breakfast: 'Poha',
    lunch: 'Rice, Rajma, Jeera Aloo',
    dinner: 'Roti, Chana Masala',
  },
  {
    day: 'Wednesday',
    breakfast: 'Upma',
    lunch: 'Rice, Sambar, Beans Poriyal',
    dinner: 'Roti, Mix Veg',
  },
  {
    day: 'Thursday',
    breakfast: 'Dosa',
    lunch: 'Rice, Dal, Bhindi Masala',
    dinner: 'Roti, Dal Makhani',
  },
  {
    day: 'Friday',
    breakfast: 'Paratha',
    lunch: 'Rice, Chole, Aloo Matar',
    dinner: 'Roti, Shahi Paneer',
  },
  {
    day: 'Saturday',
    breakfast: 'Bread Omelette',
    lunch: 'Biryani, Raita',
    dinner: 'Noodles, Manchurian',
  },
  {
    day: 'Sunday',
    breakfast: 'Chole Bhature',
    lunch: 'Puri, Aloo Sabzi, Kheer',
    dinner: 'Rice, Dal, Papad',
  },
];

export default function MessOwnerDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your mess business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {messOwnerStats.map((stat) => (
          <div key={stat.name} className="bg-card border-border rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.name}</p>
                <p className="text-foreground mt-1 text-2xl font-bold">{stat.value}</p>
                {stat.change && (
                  <p className="mt-1 text-sm font-medium text-green-500">
                    {stat.change} vs last month
                  </p>
                )}
              </div>
              <div className={cn('rounded-xl p-3', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Revenue Chart & Pending Requests */}
        <div className="space-y-6 lg:col-span-2">
          {/* Revenue Chart Placeholder */}
          <div className="bg-card border-border rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Revenue Overview</h2>
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-30" />
                <p>Chart placeholder - Recharts integration pending</p>
                <p className="text-sm">Monthly: ₹4.85L | Subscribers: 156</p>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pending Subscription Requests</h2>
              <button className="text-primary text-sm hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-border hover:bg-accent/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div>
                    <p className="text-foreground text-sm font-medium">{request.student}</p>
                    <p className="text-muted-foreground text-xs">
                      {request.room} • {request.plan} Plan
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-yellow-500/10 text-yellow-700 dark:text-yellow-300">
                      Pending
                    </span>
                    <button className="rounded bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20">
                      Accept
                    </button>
                    <button className="rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Menu */}
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">This Week's Menu</h2>
              <button className="text-primary text-sm hover:underline">Edit Menu</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border text-muted-foreground border-b text-left">
                    <th className="pb-2 font-medium">Day</th>
                    <th className="pb-2 font-medium">Breakfast</th>
                    <th className="pb-2 font-medium">Lunch</th>
                    <th className="pb-2 font-medium">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyMenu.map((day, index) => (
                    <tr key={day.day} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-3 font-medium">{day.day}</td>
                      <td className="text-muted-foreground py-3">{day.breakfast}</td>
                      <td className="text-muted-foreground py-3">{day.lunch}</td>
                      <td className="text-muted-foreground py-3">{day.dinner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Reviews */}
        <div className="space-y-6">
          {/* Recent Reviews */}
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Reviews</h2>
              <button className="text-primary text-sm hover:underline">View all</button>
            </div>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border-border rounded-lg border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium">{review.student}</p>
                    <span className="text-muted-foreground text-xs">{review.date}</span>
                  </div>
                  <div className="mb-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border-border rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Quick Stats</h2>
            <div className="space-y-3">
              <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg. Revenue/Student</p>
                    <p className="text-muted-foreground text-xs">₹3,109/month</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2 text-green-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg. Prep Time</p>
                    <p className="text-muted-foreground text-xs">25 minutes</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Menu Variety Score</p>
                    <p className="text-muted-foreground text-xs">8.5/10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
