export interface Hostel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  images: string[];
  amenities: string[];
  rules: string[];
  adminId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  hostelId: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  currentOccupancy: number;
  rentPerMonth: number;
  depositAmount: number;
  amenities: string[];
  images: string[];
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export type RoomType = 'single' | 'double' | 'triple' | 'quad' | 'dormitory';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface RoomAllocation {
  id: string;
  roomId: string;
  studentId: string;
  allocatedAt: string;
  vacatedAt?: string;
  isActive: boolean;
}
