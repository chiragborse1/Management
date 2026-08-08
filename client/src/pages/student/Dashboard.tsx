'use client';

import {
  Utensils,
  Home,
  MessageSquare,
  Star,
  Bell,
  CreditCard,
  Calendar,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const studentStats = [
  { name: 'Current Room', value: 'Room 101', icon: Home, color: 'text-blue-500 bg-blue-500/10' },
  {
    name: 'Active Mess Plan',
    value: 'Monthly Veg',
    icon: Utensils,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    name: 'Pending Bills',
    value: formatCurrency(3500),
    icon: CreditCard,
    color: 'text-orange-500 bg-orange-500/10',
  },
  { name: 'Open Complaints', value: '2', icon: MessageSquare, color: 'text-red-500 bg-red-500/10' },
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Mess Bill Due',
    date: 'Oct 5, 2024',
    amount: '₹3,500',
    type: 'payment',
    icon: CreditCard,
    color: 'text-orange-500',
  },
  {
    id: '2',
    title: 'Room Inspection',
    date: 'Oct 10, 2024',
    time: '10:00 AM',
    type: 'inspection',
    icon: Shield,
    color: 'text-blue-500',
  },
  {
    id: '3',
    title: 'New Menu Published',
    date: 'Oct 7, 2024',
    type: 'menu',
    icon: Utensils,
    color: 'text-green-500',
  },
  {
    id: '4',
    title: 'Festival Holiday',
    date: 'Oct 15, 2024',
    type: 'holiday',
    icon: Calendar,
    color: 'text-purple-500',
  },
];

const quickActions = [
  {
    name: 'View Menu',
    href: '/student/mess',
    icon: Utensils,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    name: 'Pay Bills',
    href: '/student/payments',
    icon: CreditCard,
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    name: 'Raise Complaint',
    href: '/student/complaints/new',
    icon: MessageSquare,
    color: 'text-red-500 bg-red-500/10',
  },
  {
    name: 'Give Feedback',
    href: '/student/feedback',
    icon: Star,
    color: 'text-yellow-500 bg-yellow-500/10',
  },
  { name: 'My Room', href: '/student/room', icon: Home, color: 'text-blue-500 bg-blue-500/10' },
  {
    name: 'Notifications',
    href: '/student/notifications',
    icon: Bell,
    color: 'text-purple-500 bg-purple-500/10',
  },
];

const recentComplaints = [
  {
    id: '1',
    title: 'Water leakage in bathroom',
    status: 'in_progress',
    priority: 'high',
    date: 'Oct 1, 2024',
  },
  {
    id: '2',
    title: 'WiFi not working',
    status: 'resolved',
    priority: 'medium',
    date: 'Sep 28, 2024',
  },
];

const statusColors: Record<string, string> = {
  submitted: 'bg-gray-500',
  acknowledged: 'bg-blue-500',
  in_progress: 'bg-orange-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-400',
  rejected: 'bg-red-500',
};

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your hostel overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {studentStats.map((stat) => (
          <div key={stat.name} className="bg-card border-border rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.name}</p>
                <p className="text-foreground mt-1 text-2xl font-bold">{stat.value}</p>
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
        {/* Upcoming Events & Quick Actions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Upcoming Events */}
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
              <button className="text-primary text-sm hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="hover:bg-accent/50 flex items-center gap-4 rounded-lg p-3 transition-colors"
                >
                  <div
                    className={cn('flex-shrink-0 rounded-full p-2', `${event.color} bg-current/10`)}
                  >
                    <event.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.date} {event.time && `at ${event.time}`}
                    </p>
                  </div>
                  {event.amount && (
                    <span className="text-sm font-semibold text-orange-500">{event.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Complaints</h2>
              <button className="text-primary text-sm hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="hover:bg-accent/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                >
                  <div>
                    <p className="text-foreground text-sm font-medium">{complaint.title}</p>
                    <p className="text-muted-foreground text-xs">{complaint.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium text-white',
                        statusColors[complaint.status] || 'bg-gray-500'
                      )}
                    >
                      {complaint.status.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        complaint.priority === 'high' && 'bg-red-500 text-white',
                        complaint.priority === 'medium' && 'bg-orange-500 text-white',
                        complaint.priority === 'low' && 'bg-green-500 text-white'
                      )}
                    >
                      {complaint.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="bg-card border-border sticky top-24 rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className={cn(
                  'border-border hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors'
                )}
              >
                <div className={cn('rounded-lg p-2', action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
