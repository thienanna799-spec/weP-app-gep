/**
 * Warehouse configuration — Dynamic, persisted to localStorage
 * ─────────────────────────────────────────────────────────────
 * Single warehouse. Zones are user-configurable (add/edit/remove).
 * Alert thresholds are user-configurable.
 * WarehouseMap3D + StorageAreaManagement both consume this config.
 */

export interface WarehouseZone {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  shelves: number;
}

export interface WarehouseFacility {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string;
}

export interface AlertThresholds {
  warning: number;   // default 70%
  danger: number;    // default 85%
  critical: number;  // default 95%
}

export interface WarehouseConfig {
  width: number;      // meters
  length: number;     // meters
  area: number;       // m² (width × length)
  slotSize: number;   // m² per slot (default 0.36 = 0.6m × 0.6m)
  zones: WarehouseZone[];
  facilities: WarehouseFacility[];
  thresholds: AlertThresholds;
}

// ── Default Config ─────────────────────────────────────
const DEFAULT_CONFIG: WarehouseConfig = {
  width: 10,
  length: 10,
  area: 100,
  slotSize: 0.36,
  zones: [],
  facilities: [],
  thresholds: {
    warning: 70,
    danger: 85,
    critical: 95
  }
};

export const WAREHOUSE = DEFAULT_CONFIG;

export interface WarehouseRoll {
  id: string;
  code?: string;
  status: string;
  positionArea?: string;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  'trong_kho': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Trong kho' },
  'da_giu_cho_don': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'Đã giữ chỗ' },
  'da_xuat_kho': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Đã xuất kho' },
  'loi_hong': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Lỗi / Hỏng' },
  'dang_san_xuat': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Đang sản xuất' },
};

export default DEFAULT_CONFIG;