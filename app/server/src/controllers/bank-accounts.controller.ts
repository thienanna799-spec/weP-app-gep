/**
 * Bank Account Controller
 * ─────────────────────────────────────────────────────────
 * System-level bank account management.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/** GET /api/bank-accounts */
export const getBankAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  sendSuccess(res, accounts);
});

/** GET /api/bank-accounts/default */
export const getDefaultBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const account = await prisma.bankAccount.findFirst({
    where: { isDefault: true, isActive: true },
  });
  sendSuccess(res, account);
});

/** POST /api/bank-accounts */
export const createBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;

  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await prisma.bankAccount.create({ data });

  await prisma.userActivityLog.create({
    data: {
      userId: req.user!.uid,
      email: req.user!.email,
      action: 'Thêm tài khoản ngân hàng',
      module: 'Thanh toán',
      referenceId: account.id,
      description: `Thêm TK: ${account.bankName} - ${account.accountNumber}`,
    },
  });

  sendSuccess(res, account, 201, 'Bank account created');
});

/** PUT /api/bank-accounts/:id */
export const updateBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body;

  if (data.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { isDefault: true, id: { not: req.params.id } },
      data: { isDefault: false },
    });
  }

  const account = await prisma.bankAccount.update({
    where: { id: req.params.id },
    data,
  });

  sendSuccess(res, account, 200, 'Bank account updated');
});

/** DELETE /api/bank-accounts/:id */
export const deleteBankAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.bankAccount.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  sendSuccess(res, null, 200, 'Bank account deactivated');
});
