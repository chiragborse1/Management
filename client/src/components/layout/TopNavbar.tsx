'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Moon, Sun, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUnreadCount } from '@/hooks';
import { NotificationItem } from './NotificationItem';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: unreadCount } = useUnreadCount();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    {
      id: '1',
      type: 'complaint_resolved',
      title: 'Complaint Resolved',
      message: 'Your complaint about water supply has been resolved.',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: '2',
      type: 'payment_due',
      title: 'Payment Due',
      message: 'Your monthly mess bill of ₹3,500 is due on 5th Oct.',
      time: '1 day ago',
      unread: true,
    },
    {
      id: '3',
      type: 'menu_published',
      title: 'New Menu',
      message: "This week's menu has been published.",
      time: '2 days ago',
      unread: false,
    },
  ];

  // Fall back to the mock list's count while the real query hasn't loaded.
  const badgeCount = unreadCount ?? mockNotifications.filter((n) => n.unread).length;

  if (!user) return null;

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-30 h-16 border-b backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side - Page title / breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Sidebar toggle for mobile */}
          <button
            className="hover:bg-accent rounded-md p-2 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="hover:bg-accent rounded-md p-2 transition-colors"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="hover:bg-accent relative rounded-md p-2 transition-colors"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="bg-card border-border animate-in slide-in-from-top-2 absolute right-0 mt-2 w-80 rounded-lg border py-2 shadow-lg duration-200">
                <div className="border-border flex items-center justify-between border-b px-4 py-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <button className="text-primary text-sm hover:underline">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {mockNotifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} />
                  ))}
                </div>
                <div className="border-border border-t px-4 py-2">
                  <button className="text-primary w-full text-center text-sm hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative ml-2" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="hover:bg-accent flex items-center gap-2 rounded-md p-1.5 transition-colors"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium sm:block">{user.name}</span>
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            </button>

            {showUserMenu && (
              <div className="bg-card border-border animate-in slide-in-from-top-2 absolute right-0 mt-2 w-48 rounded-lg border py-1 shadow-lg duration-200">
                <div className="border-border border-b px-4 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                <button className="text-foreground hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button className="text-foreground hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <hr className="border-border my-1" />
                <button
                  onClick={() => void logout()}
                  className="text-destructive hover:bg-accent flex w-full items-center gap-2 px-4 py-2 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
