export interface Material {
  id: string;
  code: string;
  name: string;
  group: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  supplier?: string;
  warehouseLocation?: string;
  status: 'con_hang' | 'sap_het' | 'het_hang' | 'ngung_dung';
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
