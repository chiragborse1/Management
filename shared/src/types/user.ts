export type UserRole = 'student' | 'admin' | 'mess_owner';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends BaseUser {
  role: 'student';
  studentId: string;
  hostelId?: string;
  roomId?: string;
  parentPhone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface Admin extends BaseUser {
  role: 'admin';
  hostelId: string;
  permissions: AdminPermission[];
}

export interface MessOwner extends BaseUser {
  role: 'mess_owner';
  messId?: string;
  businessName: string;
  gstNumber?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
}

export type User = Student | Admin | MessOwner;

export type AdminPermission =
  | 'manage_students'
  | 'manage_rooms'
  | 'manage_hostel'
  | 'manage_mess'
  | 'manage_complaints'
  | 'manage_payments'
  | 'generate_reports'
  | 'view_analytics';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh' | 'reset';
}
