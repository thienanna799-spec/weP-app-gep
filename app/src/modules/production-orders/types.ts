/**
 * Production Orders — Shared Types & Constants
 */

export const PRIORITY_LABELS: Record<string, {
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
}> = {
  khan_cap: { label: 'Khẩn cấp', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
  cao: { label: 'Cao', color: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  trung_binh: { label: 'Trung bình', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  thap: { label: 'Thấp', color: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
};

export interface NewOrderFormData {
  code: string;
  productionDate: string;
  personInChargeName: string;
  requiredQuantity: number;
  specs: string;
  productName: string;
  targetRolls: number;
  rollLength: number;
  rollWeight: number;
  machineArea: string;
  notes: string;
  deadline: string;
  orderId: string;
}
