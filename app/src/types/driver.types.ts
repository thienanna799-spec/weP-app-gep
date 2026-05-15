export type DriverStatus = 'available' | 'delivering' | 'leave' | 'inactive' | 'blocked';

export interface DriverSession {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  idCard: string;
  licenseNo: string;
  licenseType: string;
  licenseExpiry: string;
  status: DriverStatus;
  joinedDate: string;
  notes?: string;
  avatar?: string;
  currentVehicleId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FuelLog {
  id: string;
  driverId: string;
  vehicleId?: string;
  userId?: string;
  amount: number;
  volume: number;
  mileage: number;
  date: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}
