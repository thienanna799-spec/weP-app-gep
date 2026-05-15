import { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../middlewares/auth.middleware.js';

function emitSocket(req: AuthRequest, event: string, payload: any) {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
}

/** GET /api/drivers/me — Get current driver profile by JWT uid */
export const getMyDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  let driver = await prisma.driver.findFirst({
    where: { userId: req.user!.uid },
    include: { vehicle: true },
  });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        userId: req.user!.uid,
        code: `DRV-${Date.now().toString().slice(-6)}`,
        name: req.user!.name || req.user!.email || 'Tài xế',
        phone: '',
        email: req.user!.email || '',
        address: '',
        dob: '',
        idCard: '',
        licenseNo: '',
        licenseType: '',
        licenseExpiry: '',
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'inactive',
      },
      include: { vehicle: true },
    }) as any;
  }
  let activeOrderCount = 0;
  let trustScore = 100;
  const fraudFlags = { duplicates: 0, rejected: 0, warnings: 0 };
  
  if (driver) {
    try {
      const [count, audits] = await Promise.all([
        prisma.shippingOrder.count({
          where: { assignedDriverId: driver.id, status: 'dang_giao' },
        }),
        prisma.ocrAuditLog.findMany({
          where: { driverId: driver.id },
          select: { reviewStatus: true, fraudReason: true, riskLevel: true }
        })
      ]);
      activeOrderCount = count;

      audits.forEach(audit => {
        if (audit.reviewStatus === 'rejected') {
          trustScore -= 10;
          fraudFlags.rejected += 1;
        }
        if (audit.fraudReason === 'duplicate_receipt') {
          trustScore -= 20;
          fraudFlags.duplicates += 1;
        }
        if (audit.riskLevel === 'medium' && audit.reviewStatus !== 'approved') {
           trustScore -= 5;
           fraudFlags.warnings += 1;
        }
      });
      if (trustScore < 0) trustScore = 0;
      
    } catch { /* non-critical */ }
  }

  sendSuccess(res, { ...driver, activeOrderCount, trustScore, fraudFlags });
});

/** PUT /api/drivers/me — Driver self-update profile from APK */
export const updateMyDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  let existing = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });

  if (!existing) {
    existing = await prisma.driver.create({
      data: {
        userId: req.user!.uid,
        code: `DRV-${Date.now().toString().slice(-6)}`,
        name: req.user!.name || req.user!.email || 'Tài xế',
        phone: '', email: req.user!.email || '', address: '', dob: '',
        idCard: '', licenseNo: '', licenseType: '', licenseExpiry: '',
        joinedDate: new Date().toISOString().split('T')[0],
        status: 'inactive',
      },
    });
  }

  const { name, phone, email, address, dob, idCard, licenseNo, licenseType,
    licenseExpiry, notes, avatar, idCardPhoto, idCardPhotoBack, licensePhoto, licensePhotoBack } = req.body;

  const driver = await prisma.driver.update({
    where: { id: existing.id },
    data: {
      ...(name !== undefined && { name }), ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }), ...(address !== undefined && { address }),
      ...(dob !== undefined && { dob }), ...(idCard !== undefined && { idCard }),
      ...(licenseNo !== undefined && { licenseNo }), ...(licenseType !== undefined && { licenseType }),
      ...(licenseExpiry !== undefined && { licenseExpiry }), ...(notes !== undefined && { notes }),
      ...(avatar !== undefined && { avatar }), ...(idCardPhoto !== undefined && { idCardPhoto }),
      ...(idCardPhotoBack !== undefined && { idCardPhotoBack }), ...(licensePhoto !== undefined && { licensePhoto }),
      ...(licensePhotoBack !== undefined && { licensePhotoBack }),
    },
  });

  const userSync: any = {};
  if (phone !== undefined) userSync.phone = phone;
  if (name !== undefined) userSync.name = name;
  if (Object.keys(userSync).length > 0) {
    await prisma.user.update({ where: { uid: req.user!.uid }, data: userSync }).catch(() => {});
  }

  emitSocket(req, 'user_updated', { type: 'driver_profile_update', driver: { id: driver.id, name: driver.name } });
  sendSuccess(res, driver, 200, 'Driver profile updated');
});

/** POST /api/drivers/me/documents — Upload document photos (front+back) from APK */
export const uploadMyDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  let existing = await prisma.driver.findFirst({ where: { userId: req.user!.uid } });
  if (!existing) {
    existing = await prisma.driver.create({
      data: {
        userId: req.user!.uid,
        code: `DRV-${Date.now().toString().slice(-6)}`,
        name: req.user!.name || req.user!.email || 'Tài xế',
        phone: '', email: req.user!.email || '', address: '', dob: '', idCard: '', licenseNo: '', licenseType: '', licenseExpiry: '',
        joinedDate: new Date().toISOString().split('T')[0], status: 'inactive',
      },
    });
  }

  const { idCardPhoto, idCardPhotoBack, licensePhoto, licensePhotoBack } = req.body;
  if (!idCardPhoto && !idCardPhotoBack && !licensePhoto && !licensePhotoBack) {
    sendError(res, 'At least one document photo is required', 400);
    return;
  }

  const data: any = {};
  if (idCardPhoto) data.idCardPhoto = idCardPhoto;
  if (idCardPhotoBack) data.idCardPhotoBack = idCardPhotoBack;
  if (licensePhoto) data.licensePhoto = licensePhoto;
  if (licensePhotoBack) data.licensePhotoBack = licensePhotoBack;

  const driver = await prisma.driver.update({ where: { id: existing.id }, data });

  emitSocket(req, 'user_updated', { type: 'driver_documents_uploaded', driver: { id: driver.id, name: driver.name } });
  sendSuccess(res, {
    id: driver.id, cccdFront: !!driver.idCardPhoto, cccdBack: !!driver.idCardPhotoBack,
    gplxFront: !!driver.licensePhoto, gplxBack: !!driver.licensePhotoBack,
  }, 200, 'Documents uploaded');
});
