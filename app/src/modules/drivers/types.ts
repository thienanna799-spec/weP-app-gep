export type DriverStatus = 'available' | 'delivering' | 'leave' | 'inactive' | 'blocked';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'broken' | 'inactive';

export interface GpsLog {
  id: string;
  driverId: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Driver {
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
  idCardPhoto?: string;
  idCardPhotoBack?: string;
  licensePhoto?: string;
  licensePhotoBack?: string;
  currentVehicleId?: string;
  userId?: string;
  /** Real-time: plate number from today's APK check-in (DailyVehicleLog) */
  todayPlate?: string | null;
  /** Real-time: vehicleId from today's APK check-in */
  todayVehicleId?: string | null;
  /** Included from backend join */
  vehicle?: { id: string; plateNumber: string; type: string } | null;
  /** Trust Score (0-100) based on OCR Audits */
  trustScore?: number;
  /** Fraud Analytics Flags */
  fraudFlags?: {
    duplicates: number;
    rejected: number;
    warnings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  year: number;
  condition: string;
  registrationDate: string;
  insuranceExpiry: string;
  currentMileage: number;
  status: VehicleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  cost: number;
  mileage: number;
  notes?: string;
  createdAt: string;
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
