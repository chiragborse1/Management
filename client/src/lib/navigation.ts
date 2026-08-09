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

/** Route for a role's profile/settings page (used by the top-nav user menu). */
export function getSettingsPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/settings';
    case 'mess_owner':
      return '/mess-owner/settings';
    case 'student':
      return '/student/settings';
  }
}
