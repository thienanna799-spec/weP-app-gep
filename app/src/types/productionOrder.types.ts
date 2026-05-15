export type ProductionOrderStatus = 
  | 'waiting_material' 
  | 'ready' 
  | 'producing' 
  | 'completed' 
  | 'cancelled';

export interface ProductionOrderMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
}

export interface ProductionOrder {
  id: string;
  code: string;
  productionDate: string;
  creatorId: string;
  creatorName?: string;
  personInChargeId?: string;
  personInChargeName?: string;
  requiredQuantity: number;
  specs: string;
  status: ProductionOrderStatus;
  materials: ProductionOrderMaterial[];
  consumptionRate?: string;
  targetRolls: number;
  rollLength: number;
  rollWeight: number;
  productName?: string;
  machineArea?: string;
  notes?: string;
  deadline?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  _count?: { rolls: number };
  _goodRolls?: number;
  _defectRolls?: number;
}
