/**
 * CRM Controller
 * ─────────────────────────────────────────────────────────
 * Endpoints for Customer CRM features:
 * - Internal Notes
 * - Follow-Up Tasks (scheduling)
 * - Activity Timeline
 * - 360° Profile Data
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

// ── CRM 360° Profile ─────────────────────────────────────

/** GET /api/customers/:id/crm */
export const getCrmProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const customerId = req.params.id;

  const [customer, notes, followUps, activities, orders] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customerNote.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.customerActivity.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, code: true, status: true, priority: true,
        quantity: true, totalRevenue: true, totalCost: true,
        paymentStatus: true, paymentMethod: true,
        createdAt: true, deliveryDeadline: true,
      },
    }),
  ]);

  if (!customer) {
    sendError(res, 'Customer not found', 404);
    return;
  }

  // Mark overdue follow-ups
  const now = new Date();
  const enrichedFollowUps = followUps.map(f => ({
    ...f,
    isOverdue: f.status === 'pending' && new Date(f.dueDate) < now,
  }));

  // Aggregate stats
  const totalQuantity = orders.reduce((s, o) => s + (o.quantity || 0), 0);

  sendSuccess(res, {
    customer,
    notes,
    followUps: enrichedFollowUps,
    activities,
    orders,
    stats: {
      totalOrders: customer._count?.orders || customer.totalOrders,
      totalQuantity,
      totalRevenue: customer.totalRevenue || 0,
    },
  });
});

// ── INTERNAL NOTES ────────────────────────────────────────

/** POST /api/customers/:id/notes */
export const createNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) {
    sendError(res, 'Nội dung ghi chú không được trống', 400);
    return;
  }

  const note = await prisma.customerNote.create({
    data: {
      customerId: req.params.id,
      content: content.trim(),
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
  });

  // Log activity
  await prisma.customerActivity.create({
    data: {
      customerId: req.params.id,
      type: 'note_added',
      title: 'Thêm ghi chú nội bộ',
      description: content.trim().substring(0, 200),
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
  });

  sendSuccess(res, note, 201);
});

/** DELETE /api/customers/:id/notes/:noteId */
export const deleteNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.customerNote.delete({
    where: { id: req.params.noteId },
  });
  sendSuccess(res, null, 200, 'Note deleted');
});

// ── FOLLOW-UP TASKS ───────────────────────────────────────

/** POST /api/customers/:id/follow-ups */
export const createFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, dueDate, type } = req.body;
  if (!title?.trim()) {
    sendError(res, 'Tiêu đề không được trống', 400);
    return;
  }
  if (!dueDate) {
    sendError(res, 'Ngày hẹn không được trống', 400);
    return;
  }

  const followUp = await prisma.customerFollowUp.create({
    data: {
      customerId: req.params.id,
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: new Date(dueDate),
      type: type || 'call',
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
  });

  // Log activity
  await prisma.customerActivity.create({
    data: {
      customerId: req.params.id,
      type: 'followup_created',
      title: `Tạo lịch nhắc: ${title.trim()}`,
      description: `Hẹn ${type || 'call'} - ${new Date(dueDate).toLocaleDateString('vi-VN')}`,
      createdBy: req.user!.uid,
      createdByName: req.user!.name || req.user!.email,
    },
  });

  sendSuccess(res, followUp, 201);
});

/** PUT /api/customers/:id/follow-ups/:followUpId */
export const updateFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, title, dueDate, type, description } = req.body;

  const data: any = {};
  if (status) {
    data.status = status;
    if (status === 'completed') data.completedAt = new Date();
  }
  if (title) data.title = title;
  if (dueDate) data.dueDate = new Date(dueDate);
  if (type) data.type = type;
  if (description !== undefined) data.description = description;

  const followUp = await prisma.customerFollowUp.update({
    where: { id: req.params.followUpId },
    data,
  });

  // Log completion
  if (status === 'completed') {
    await prisma.customerActivity.create({
      data: {
        customerId: req.params.id,
        type: 'followup_completed',
        title: `Hoàn thành: ${followUp.title}`,
        createdBy: req.user!.uid,
        createdByName: req.user!.name || req.user!.email,
      },
    });
  }

  sendSuccess(res, followUp);
});

/** DELETE /api/customers/:id/follow-ups/:followUpId */
export const deleteFollowUp = asyncHandler(async (req: AuthRequest, res: Response) => {
  await prisma.customerFollowUp.delete({
    where: { id: req.params.followUpId },
  });
  sendSuccess(res, null, 200, 'Follow-up deleted');
});

// ── ACTIVITY TIMELINE ─────────────────────────────────────

/** GET /api/customers/:id/activities */
export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const activities = await prisma.customerActivity.findMany({
    where: { customerId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  sendSuccess(res, activities);
});
