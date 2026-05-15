import api from '../../../services/api';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  taxCode?: string;
  bankAccount?: string;
  bankName?: string;
  rating?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { purchaseOrders: number };
}

export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  expectedDate?: string;
  receivedDate?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdBy: string;
  createdByName?: string;
  notes?: string;
  createdAt: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
  logs?: { id: string; action: string; createdBy: string; createdAt: string; note?: string }[];
}

export interface LowStockMaterial {
  id: string;
  code: string;
  name: string;
  group?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  supplier?: string;
}

export const suppliersService = {
  getAll: (search?: string) => api.get<Supplier[]>(`/suppliers${search ? `?search=${search}` : ''}`),
  getById: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

export const purchaseOrdersService = {
  getAll: (status?: string, supplierId?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'All') params.set('status', status);
    if (supplierId) params.set('supplierId', supplierId);
    const qs = params.toString();
    return api.get<PurchaseOrder[]>(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => api.get<PurchaseOrder>(`/purchase-orders/${id}`),
  create: (data: any) => api.post<PurchaseOrder>('/purchase-orders', data),
  update: (id: string, data: any) => api.put<PurchaseOrder>(`/purchase-orders/${id}`, data),
  submit: (id: string) => api.put(`/purchase-orders/${id}/submit`, {}),
  approve: (id: string) => api.put(`/purchase-orders/${id}/approve`, {}),
  markOrdered: (id: string) => api.put(`/purchase-orders/${id}/order`, {}),
  receive: (id: string, items: { purchaseOrderItemId: string; receivedQty: number }[]) =>
    api.put(`/purchase-orders/${id}/receive`, { items }),
  cancel: (id: string, reason?: string) => api.put(`/purchase-orders/${id}/cancel`, { reason }),
  delete: (id: string) => api.delete(`/purchase-orders/${id}`),
};

export const lowStockService = {
  getAll: () => api.get<LowStockMaterial[]>('/materials/low-stock'),
  suggestPO: (materialId: string) => api.post<PurchaseOrder>(`/materials/${materialId}/suggest-po`, {}),
};
