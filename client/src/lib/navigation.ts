import type { UserRole } from '@shared/types';

/** Route for a role's landing dashboard. */
export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'mess_owner':
      return '/mess-owner/dashboard';
    case 'student':
      return '/student/dashboard';
  }
}
