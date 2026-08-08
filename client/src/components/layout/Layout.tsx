'use client';

import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function Layout() {
  return (
    <div className="bg-background min-h-screen">
      <Sidebar />
      <div className={cn('transition-all duration-300 lg:pl-64', 'min-h-screen')}>
        <TopNavbar />
        <main className="p-4 pt-20 lg:p-6 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
