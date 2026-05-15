import api from '../../../services/api';
import { ProductRoll, ImportBatch } from '../types';

export const inventoryService = {
  createRoll: async (data: Omit<ProductRoll, 'id' | 'createdAt' | 'updatedAt' | 'scanHistory'>): Promise<ProductRoll> =>
    api.post<ProductRoll>('/rolls', data),

  deleteRollGroup: async (supplier: string, subSku: string): Promise<void> => {
    await api.delete(`/inventory/rolls/group?supplier=${encodeURIComponent(supplier)}&subSku=${encodeURIComponent(subSku)}`);
  },

  updateRollStatus: async (id: string, status: ProductRoll['status'], _operator: string, actionNote: string): Promise<void> => {
    await api.put(`/rolls/${id}/status`, { status, actionNote });
  },

  transferRoll: async (rollId: string, fromPos: any, toPos: any, operator: string, reason: string): Promise<void> => {
    await api.put(`/rolls/${rollId}/transfer`, { fromPosition: fromPos, toPosition: toPos, operator, reason });
  },

  shipRoll: async (qrCode: string, orderId: string, operator: string): Promise<void> => {
    // Find roll by QR first, then ship
    const roll = await api.get<ProductRoll>(`/rolls/qr/${encodeURIComponent(qrCode)}`);
    if (!roll) throw new Error('Mã QR không tồn tại');
    await api.put(`/rolls/${roll.id}/ship`, { orderId, operator });
  },

  saveCheckResult: async (check: any): Promise<void> => {
    await api.post('/rolls/inventory-check', check);
  },

  getRollByQR: async (qrCode: string): Promise<ProductRoll | null> => {
    try {
      return await api.get<ProductRoll>(`/rolls/qr/${encodeURIComponent(qrCode)}`);
    } catch {
      return null;
    }
  },

  // ── Import Batches ─────────────────────────────────────
  createImportBatch: async (data: {
    productName: string;
    sku?: string;
    subSku?: string;
    specification?: string;
    color?: string;
    otherSpecs?: string;
    costPrice?: number;
    quantity: number;
    supplier?: string;
    note?: string;
    quickImport?: boolean;
  }): Promise<ImportBatch> =>
    api.post<ImportBatch>('/inventory/import-batch', data),

  getImportBatches: async (): Promise<ImportBatch[]> =>
    api.get<ImportBatch[]>('/inventory/import-batch'),

  getImportBatch: async (id: string): Promise<ImportBatch> =>
    api.get<ImportBatch>(`/inventory/import-batch/${id}`),

  scanManualRoll: async (qrCode: string, quality: string = 'new'): Promise<any> =>
    api.post('/inventory/scan-manual', { qrCode, quality }),

  markBatchDone: async (id: string): Promise<ImportBatch> =>
    api.post<ImportBatch>(`/inventory/import-batch/${id}/done`, {}),

  // ── Excel Import ───────────────────────────────────────
  downloadImportTemplate: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token') || '';
    const a = document.createElement('a');
    a.href = `/api/inventory/import-template?token=${token}`;
    a.download = 'import_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  importExcel: async (fileBase64: string, quickImport: boolean = false): Promise<{
    batchIds: string[];
    summary: { totalRows: number; success: number; failed: number; totalRollsCreated: number };
    errors: { row: number; message: string }[];
  }> =>
    api.post('/inventory/import-excel', { fileBase64, quickImport }),

  // ── Stock Summary (Tổng hợp tồn) ────────────────────────
  getStockSummary: async (): Promise<{
    supplier: string;
    subSku: string;
    productName: string;
    sku: string;
    specification: string;
    nhapKho: number;
    xuatKho: number;
    tonKho: number;
  }[]> =>
    api.get('/inventory/stock-summary'),

  syncStock: async (fileBase64: string): Promise<{
    summary: { totalRows: number; matched: number; notFound: number; updated: number };
    errors: { row: number; message: string }[];
    details: { row: number; supplier: string; subSku: string; status: string; oldQty: number; newQty: number }[];
  }> =>
    api.post('/inventory/sync-stock', { fileBase64 }),

  // ── Product Catalog (Tổng sản phẩm) ────────────────────
  getProductCatalog: async (): Promise<{ products: any[] }> =>
    api.get('/inventory/products'),

  getProductCatalogItem: async (id: string): Promise<any> =>
    api.get(`/inventory/products/${id}`),

  // ── SUB-SKU Lookup ────────────────────────────────────────
  lookupSubSku: async (q: string): Promise<{
    subSku: string; sku: s