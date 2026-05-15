export interface OcrAuditSummary {
  id: string;
  differenceValue: number | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  fraudReason: string | null;
  extractedValue: number | null;
  pipelineStatus: string;
}

export interface FuelEntry {
  id: string;
  fuelKm: number | null;
  fuelKmPhoto: string | null;
  fuelCost: number | null;
  fuelCostPhoto: string | null;
  fuelPricePerLiter: number | null;
  fuelPricePhoto: string | null;
  fuelVolume: number | null;
  fuelNotes: string | null;
  createdAt: string;
  ocrAudits?: OcrAuditSummary[];
}

export interface DailyLog {
  id: string;
  logDate: string;
  vehicleId: string;
  driverId: string;
  plateNumber: string;
  driverName: string;
  startKm: number | null;
  startKmPhoto: string | null;
  checkInTime: string | null;
  endKm: number | null;
  endKmPhoto: string | null;
  checkOutTime: string | null;
  totalKm: number | null;
  status: string;
  fuelEntries: FuelEntry[];
  ocrAudits?: OcrAuditSummary[];
  vehicle?: { id: string; plateNumber: string; type: string };
  driver?: { id: string; name: string; code: string; avatar?: string };
}

// Flatten log into display rows: 1 session row + N fuel rows
export interface DisplayRow {
  type: 'session' | 'fuel';
  log: DailyLog;
  fuelEntry?: FuelEntry;
  isFirst: boolean; // first row of this log group
  groupSize: number; // total rows in this group
}

export interface DriverLogsTabProps {
  fuelLogs: any[];
  maintenances: any[];
  drivers: { id: string; name: string }[];
  vehicles: { id: string; plateNumber: string }[];
}
