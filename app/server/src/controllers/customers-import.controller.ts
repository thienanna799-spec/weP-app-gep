/**
 * Customer Import Controller (v2 — CRM Mini)
 * ─────────────────────────────────────────────────────────
 * Excel bulk import for customers with upsert (customerCode = unique key).
 *   GET  /api/customers/template     → download Excel template
 *   POST /api/customers/import       → parse + validate + upsert
 */

import { Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { CustomerExcelService } from '../services/excel.service.js';

export const downloadCustomerTemplate = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const buffer = await CustomerExcelService.generateTemplate();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="customer_import_template_v2.xlsx"');
  res.send(buffer);
});

export const importCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileBase64 } = req.body as { fileBase64: string };
  if (!fileBase64) { sendError(res, 'fileBase64 is required', 400); return; }

  try {
    const result = await CustomerExcelService.processImport(fileBase64, req.user!.uid, req.user!.name || req.user!.email);
    
    const io = req.app.get('io');
    if (io) io.emit('customer_updated', { type: 'excel_import', created: result.summary.created, updated: result.summary.updated });

    sendSuccess(res, result, 201, `Import complete: ${result.summary.created} tạo mới, ${result.summary.updated} cập nhật`);
  } catch (error: any) {
    sendError(res, error.message, 400);
  }
});
