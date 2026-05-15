import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// Map Vietnamese status text (from frontend) → Prisma enum key
const STATUS_MAP: Record<string, string> = {
  'còn hàng': 'con_hang',
  'sắp hết': 'sap_het',
  'hết hàng': 'het_hang',
  'ngừng sử dụng': 'ngung_dung',
};

/** Normalise incoming data so Prisma receives the correct types */
function sanitiseMaterialData(data: Record<string, any>): Record<string, any> {
  // Convert Vietnamese status → enum key (pass through if already an enum key)
  if (data.status && STATUS_MAP[data.status]) {
    data.status = STATUS_MAP[data.status];
  }
  // Ensure numeric fields are numbers, not strings
  const numericFields = ['currentStock', 'minStock', 'purchasePrice'];
  for (const f of numericFields) {
    if (data[f] !== undefined) data[f] = Number(data[f]) || 0;
  }
  return data;
}

/** GET /api/materials */
export const getMaterials = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const materials = await prisma.material.findMany({ orderBy: { code: 'asc' } });
  sendSuccess(res, materials);
});

/** GET /api/materials/:id */
export const getMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mat = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!mat) { sendError(res, 'Material not found', 404); return; }
  sendSuccess(res, mat);
});

/** POST /api/materials */
export const createMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body;
  const validFields = [
    'code', 'name', 'group', 'unit', 'currentStock', 'minStock',
    'purchasePrice', 'supplier', 'warehouseLocation', 'status', 'notes', 'imageUrl'
  ];
  const data: Record<string, any> = {};
  for (const key of validFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  data.code = data.code || `MAT-${Date.now().toString().slice(-6)}`;
  sanitiseMaterialData(data);

  const mat = await prisma.material.create({ data: data as any });
  sendSuccess(res, mat, 201, 'Material created');
});

/** PUT /api/materials/:id */
export const updateMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = req.body;
  const validFields = [
    'code', 'name', 'group', 'unit', 'currentStock', 'minStock',
    'purchasePrice', 'supplier', 'warehouseLocation', 'status', 'notes', 'imageUrl'
  ];
  const data: Record<string, any> = {};
  for (const key of validFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  sanitiseMaterialData(data);

  const mat = await prisma.material.update({
    where: { id: req.params.id },
    data: data as any,
  });
  sendSuccess(res, mat, 200, 'Material updated');
});

/** DELETE /api/materials/:id */
export const deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.material.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Material deleted');
});

// --- Transactions ---

/** GET /api/materials/transactions */
export const getTransactions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const txns = await prisma.materialTransaction.findMany({
    include: { items: true },
    orderBy: { date: 'desc' },
  });
  sendSuccess(res, txns);
});

/** POST /api/materials/transactions */
export const createTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, ...txnData } = req.body as {
    type: 'import' | 'export';
    supplier?: string;
    referenceId?: string;
    notes?: string;
    operator: string;
    items: { materialId: string; materialName: string; quantity: number; unitPrice?: number }[];
  };

  // Use Prisma interactive transaction for stock update + record creation atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction record
    const txn = await tx.materialTransaction.create({
      data: {
        ...txnData,
        items: { create: items },
      },
      include: { items: true },
    });

    // Update stock for each item
    for (const item of items) {
      const mat = await tx.material.findUnique({ where: { id: item.materialId } });
      if (!mat) throw new Error(`Material ${item.materialId} not found`);

      let newStock = mat.currentStock;
      if (txnData.type === 'import') newStock += item.quantity;
      else {
        newStock -= item.quantity;
        if (newStock < 0) throw new Error(`Insufficient stock for ${item.materialName}`);
      }

      let status: string = 'con_hang';
      if (newStock <= 0) status = 'het_hang';
      else if (newStock <= mat.minStock) status = 'sap_het';

      await tx.material.update({
        where: { id: item.materialId },
        data: { currentStock: newStock, status: status as any },
      });
    }

    return txn;
  });

  sendSuccess(res, result, 201, 'Transaction created');
});

// --- BOM ---

/** GET /api/materials/bom/:productId */
export const getBOM = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bom = await prisma.materialBOM.findUnique({
    where: { productId: req.params.productId },
    include: { components: true },
  });
  sendSuccess(res, bom);
});

/** POST /api/materials/bom */
export const saveBOM = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, productName, components } = req.body;
  const bom = await prisma.materialBOM.upsert({
    where: { productId },
    update: {
      productName,
      components: {
        deleteMany: {},
        create: components,
      },
    },
    create: {
      productId,
      productName,
      components: { create: components },
    },
    include: { components: true },
  });
  sendSuccess(res, bom, 200, 'BOM saved');
});
