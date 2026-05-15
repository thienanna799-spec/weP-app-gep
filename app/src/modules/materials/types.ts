export type MaterialGroup = 
  | 'Hạt nhựa' 
  | 'Màng PE' 
  | 'Giấy carton' 
  | 'Băng keo' 
  | 'Tem QR' 
  | 'Bao bì đóng gói' 
  | 'Lõi giấy' 
  | 'Mực in' 
  | 'Pallet' 
  | 'Phụ kiện khác';

export type MaterialUnit = 'kg' | 'cuộn' | 'mét' | 'cái' | 'thùng' | 'pallet' | 'lít';

export type MaterialStatus = 'còn hàng' | 'sắp hết' | 'hết hàng' | 'ngừng sử dụng';

export interface Material {
  id: string;
  code: string;
  name: string;
  group: MaterialGroup;
  unit: MaterialUnit;
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  supplier: string;
  warehouseLocation: string;
  status: MaterialStatus;
  notes?: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface MaterialTransaction {
  id: string;
  type: 'import' | 'export';
  date: string;
  items: {
    materialId: string;
    materialName: string;
    quantity: number;
    unitPrice?: number;
  }[];
  supplier?: string;
  operator: string;
  referenceId?: string; // e.g., Production Order ID for exports
  notes?: string;
}

export interface MaterialBOM {
  id: string;
  productId: string;
  productName: string;
  components: {
    materialId: string;
    materialName: string;
    quantity: number;
    unit: MaterialUnit;
  }[];
}
