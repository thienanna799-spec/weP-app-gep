export type RollStatus = 
  | 'dang_san_xuat' 
  | 'trong_kho' 
  | 'da_giu_cho_don' 
  | 'da_xuat_kho' 
  | 'loi_hong' 
  | 'hoan_tra';

export interface WarehousePosition {
  warehouse: string; // Kho A
  area: string;      // Khu B
  shelf: string;     // Kệ 2
  layer: string;     // Tầng 1
  slot: string;      // Ô 05
}

export interface RollMovement {
  id: string;
  rollId: string;
  fromPosition: WarehousePosition | null;
  toPosition: WarehousePosition;
  operator: string;
  timestamp: string;
  reason: string;
}

export interface ProductRoll {
  id: string;
  code: string;           // Mã cuộn
  qrCode: string;         // Mã QR unique
  productId: string;      // ID sản phẩm (quy cách)
  productName: string;    // Tên sản phẩm
  specification: string;  // Quy cách (VD: K50)
  length: number;         // Chiều dài (mét)
  weight: number;         // Trọng lượng (kg)
  height?: number;        // Chiều cao cuộn (mét)
  diameter?: number;      // Đường kính cuộn (mét)
  productionDate: string;
  productionOrderId?: string; // Lệnh sản xuất liên quan
  positionWarehouse?: string;
  positionArea?: string;
  positionShelf?: string;
  positionLayer?: string;
  positionSlot?: string;
  status: RollStatus;
  creator: string;
  scanHistory: {
    timestamp: string;
    action: string;
    operator: string;
  }[];
  orderId?: string; // Đơn hàng đã gán
  materialId?: string;
  sourceType?: 'production' | 'manual';
  supplier?: string;
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCheck {
  id: string;
  date: string;
  operator: string;
  results: {
    rollId: string;
    status: 'khớp' | 'thiếu' | 'dư' | 'sai vị trí' | 'qr không tồn tại';
    actualPosition: WarehousePosition | null;
    notes?: string;
  }[];
  notes?: string;
}

export interface InventorySummary {
  productId: string;
  productName: string;
  totalPhysical: number;  // Tồn thực tế
  totalReserved: number;  // Tồn đã giữ cho đơn
  totalAvailable: number; // Tồn khả dụng
}

export interface StorageCapacity {
  total_area: number;
  used_area: number;
  available_area: number;
  total_slots: number;
  used_slots: number;
  usage_percent: number;
}

// ── Import Batches ─────────────────────────────────────
export interface ImportBatch {
  id: string;
  productName: string;
  sku?: string;
  subSku?: string;
  specification: string;
  color?: string;
  otherSpecs?: string;
  costPrice?: number;
  quantity: number;
  supplier?: string;
  note?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  rolls?: ProductRoll[];
  _count?: { rolls: number };
  statusCounts?: Record<string, number>;
}

