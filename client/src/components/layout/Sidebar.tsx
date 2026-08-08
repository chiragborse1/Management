import { useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Home,
  Building2,
  Utensils,
  FileText,
  MessageSquare,
  Star,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = {
  student: [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Hostels', href: '/student/hostels', icon: Building2 },
    { name: 'Mess', href: '/student/mess', icon: Utensils },
    { name: 'My Room', href: '/student/room', icon: Home },
    { name: 'Bills & Payments', href: '/student/payments', icon: FileText },
    { name: 'Complaints', href: '/student/complaints', icon: MessageSquare },
    { name: 'Feedback', href: '/student/feedback', icon: Star },
    { name: 'Notifications', href: '/student/notifications', icon: Bell },
    { name: 'Settings', href: '/student/settings', icon: Settings },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Rooms', href: '/admin/rooms', icon: Home },
    { name: 'Hostel Info', href: '/admin/hostel', icon: Building2 },
    { name: 'Mess Management', href: '/admin/mess', icon: Utensils },
    { name: 'Complaints', href: '/admin/complaints', icon: MessageSquare },
    { name: 'Payments', href: '/admin/payments', icon: FileText },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Analytics', href: '/admin/analytics', icon: Star },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  mess_owner: [
    { name: 'Dashboard', href: '/mess-owner/dashboard', icon: LayoutDashboard },
    { name: 'Mess Profile', href: '/mess-owner/profile', icon: Utensils },
    { name: 'Weekly Menu', href: '/mess-owner/menu', icon: FileText },
    { name: 'Subscriptions', href: '/mess-owner/subscriptions', icon: Users },
    { name: 'Reviews', href: '/mess-owner/reviews', icon: Star },
    { name: 'Revenue', href: '/mess-owner/revenue', icon: FileText },
    { name: 'Settings', href: '/mess-owner/settings', icon: Settings },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const items = navigation[user?.role || 'student'] || [];

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-border fixed top-0 left-0 z-50 flex h-screen flex-col border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className={cn(
            'border-border flex h-16 items-center justify-between border-b px-4',
            isCollapsed && 'justify-center'
          )}
        >
          <Link
            to={`/${user.role}/dashboard`}
            className="flex items-center gap-2"
            aria-label="Hostel SaaS Home"
          >
            <Building2 className="text-primary h-8 w-8" />
            {!isCollapsed && <span className="text-foreground text-xl font-bold">HostelSaas</span>}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'hover:bg-accent rounded-md p-1.5 transition-colors',
              isCollapsed && 'ml-auto'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Main navigation">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.name : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom - User info & Logout */}
        <div className={cn('border-border border-t p-4', isCollapsed && 'items-center')}>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={() => void logout()}
              className="text-muted-foreground hover:text-foreground hover:bg-accent mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="bg-card border-border fixed top-4 left-4 z-50 rounded-md border p-2 shadow-md lg:hidden"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={isMobileOpen}
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  );
}
