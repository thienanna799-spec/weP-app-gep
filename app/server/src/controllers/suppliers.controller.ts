import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/suppliers */
export const getSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, active } = req.query as { search?: string; active?: string };

  const where: any = {};
  if (active === 'true') where.isActive = true;
  if (active === 'false') where.isActive = false;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { phone: { contains: search } },
      { contactPerson: { contains: search } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  sendSuccess(res, suppliers);
});

/** GET /api/suppliers/:id */
export const getSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: req.params.id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, code: true, status: true, totalAmount: true, createdAt: true },
      },
    },
  });
  if (!supplier) { sendError(res, 'Supplier not found', 404); return; }
  sendSuccess(res, supplier);
});

/** POST /api/suppliers */
export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;

  // Auto-generate code if not provided
  if (!data.code) {
    const count = await prisma.supplier.count();
    data.code = `NCC-${String(count + 1).padStart(4, '0')}`;
  }

  const supplier = await prisma.supplier.create({ data });

  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Tạo nhà cung cấp',
      module: 'Procurement',
      referenceId: supplier.id,
      description: `NCC ${supplier.code} — ${supplier.name}`,
    },
  });

  sendSuccess(res, supplier, 201, 'Supplier created');
});

/** PUT /api/suppliers/:id */
export const updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const supplier = await prisma.supplier.update({
    where: { id: req.params.id },
    data: req.body,
  });
  sendSuccess(res, supplier, 200, 'Supplier updated');
});

/** DELETE /api/suppliers/:id */
export const deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check if supplier has POs
  const poCount = await prisma.purchaseOrder.count({ where: { supplierId: req.params.id } });
  if (poCount > 0) {
    sendError(res, `Không thể xóa NCC vì đã có ${poCount} đơn mua hàng liên quan`, 400);
    return;
  }
  await prisma.supplier.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 200, 'Supplier deleted');
});
