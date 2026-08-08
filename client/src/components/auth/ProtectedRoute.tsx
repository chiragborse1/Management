import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  const hasAccess = user ? allowedRoles.includes(user.role) : false;

  useEffect(() => {
    if (user && !hasAccess) {
      toast.error("You don't have access to this page");
    }
  }, [user, hasAccess]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
