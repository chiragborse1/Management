'use client';

import {
  Building2,
  Users,
  Utensils,
  Home,
  FileText,
  MessageSquare,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const stats = [
  {
    name: 'Total Students',
    value: '247',
    change: '+12%',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    name: 'Occupied Rooms',
    value: '189',
    change: '+5%',
    icon: Home,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    name: 'Active Mess Subs',
    value: '156',
    change: '+8%',
    icon: Utensils,
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    name: 'Monthly Revenue',
    value: formatCurrency(1245000),
    change: '+15%',
    icon: Wallet,
    color: 'text-orange-500 bg-orange-500/10',
  },
];

const recentActivity = [
  {
    id: '1',
    type: 'student_joined',
    title: 'New student registered',
    description: 'Rahul Sharma joined Room 101',
    time: '2 hours ago',
    icon: Users,
    color: 'text-green-500',
  },
  {
    id: '2',
    type: 'complaint',
    title: 'Complaint received',
    description: 'Water leakage in Room 205',
    time: '4 hours ago',
    icon: MessageSquare,
    color: 'text-orange-500',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment received',
    description: '₹15,000 from Priya Singh',
    time: '6 hours ago',
    icon: Wallet,
    color: 'text-blue-500',
  },
  {
    id: '4',
    type: 'maintenance',
    title: 'Maintenance scheduled',
    description: 'AC repair in Block A',
    time: '1 day ago',
    icon: Home,
    color: 'text-purple-500',
  },
  {
    id: '5',
    type: 'mess',
    title: 'New subscription',
    description: 'Amit Kumar subscribed to mess',
    time: '1 day ago',
    icon: Utensils,
    color: 'text-green-500',
  },
];

const quickActions = [
  {
    name: 'Add Student',
    href: '/admin/students/add',
    icon: Users,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    name: 'Manage Rooms',
    href: '/admin/rooms',
    icon: Home,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    name: 'View Complaints',
    href: '/admin/complaints',
    icon: MessageSquare,
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    name: 'Generate Report',
    href: '/admin/reports',
    icon: FileText,
    color: 'text-purple-500 bg-purple-500/10',
  },
  { name: 'Mess Menu', href: '/admin/mess', icon: Utensils, color: 'text-pink-500 bg-pink-500/10' },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    color: 'text-indigo-500 bg-indigo-500/10',
  },
];

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening at your hostel.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card border-border rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.name}</p>
                <p className="text-foreground mt-1 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-green-500">
                  {stat.change} vs last month
                </p>
              </div>
              <div className={cn('rounded-xl p-3', stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Occupancy Chart Placeholder */}
        <div className="bg-card border-border rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Room Occupancy</h2>
          <div className="text-muted-foreground flex h-64 items-center justify-center">
            <div className="text-center">
              <Building2 className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p>Chart placeholder - Recharts integration pending</p>
              <p className="text-sm">Occupancy: 76% (189/248 rooms)</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-card border-border rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Revenue Trend</h2>
          <div className="text-muted-foreground flex h-64 items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-12 w-12 opacity-30" />
              <p>Chart placeholder - Recharts integration pending</p>
              <p className="text-sm">Monthly: ₹12.45L | YoY: +15%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="bg-card border-border rounded-xl border p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-primary text-sm hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="hover:bg-accent/50 flex items-start gap-4 rounded-lg p-3 transition-colors"
              >
                <div
                  className={cn(
                    'flex-shrink-0 rounded-full p-2',
                    `${activity.color} bg-current/10`
                  )}
                >
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">{activity.title}</p>
                  <p className="text-muted-foreground text-xs">{activity.description}</p>
                </div>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border-border rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
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
