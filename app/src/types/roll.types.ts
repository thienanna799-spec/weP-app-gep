export type RollStatus =
  | 'dang_san_xuat'
  | 'trong_kho'
  | 'da_giu_cho_don'
  | 'da_xuat_kho'
  | 'loi_hong'
  | 'hoan_tra';

export interface Roll {
  id: string;
  code: string;
  qrCode: string;
  productId: string;
  productName: string;
  specification: string;
  length: number;
  weight: number;
  height?: number;
  diameter?: number;
  productionDate: string;
  productionOrderId?: string;
  positionWarehouse?: string;
  positionArea?: string;
  positionShelf?: string;
  positionLayer?: string;
  positionSlot?: string;
  status: RollStatus;
  creator: string;
  orderId?: string;
  materialId?: string;
  createdAt: string;
  updatedAt: string;

  // Included relations (optional, depend on query)
  scanHistory?: Array<{
    id: string;
    action: string;
    operator: string;
    timestamp: string;
  }>;
  order?: { code: string } | null;
}
