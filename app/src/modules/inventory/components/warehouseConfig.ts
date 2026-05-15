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
  