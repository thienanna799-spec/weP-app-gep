/**
 * Delivery Proof Controller
 * Upload/manage photos & videos as proof of delivery.
 * Required before marking an order as "complete".
 * 
 * v2: Uses multer for file uploads instead of base64.
 */
import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads directory
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'proofs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('video') ? '.mp4' : '.jpg');
    const name = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
});

/** GET /api/orders/:id/delivery-proofs — List all proofs for an order */
export const getDeliveryProofs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const proofs = await prisma.deliveryProof.findMany({
    where: { orderId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, proofs);
});

/** POST /api/orders/:id/delivery-proofs — Upload proof (multipart file OR base64 fallback) */
export const uploadDeliveryProof = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Handle multipart file upload (new way)
  if (req.file) {
    const fileType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const fileUrl = `/uploads/proofs/${req.file.filename}`;
    const proof = await prisma.deliveryProof.create({
      data: {
        orderId: req.params.id,
        fileType,
        fileName: req.file.originalname || req.file.filename,
        fileUrl,
        note: req.body.note || null,
        uploadedBy: req.user!.name || req.user!.email,
      },
    });
    sendSuccess(res, proof, 201, 'Upload chứng từ thành công');
    return;
  }

  // Fallback: base64 JSON upload (backward compatibility)
  const { fileType, fileName, fileUrl, note } = req.body;

  if (!fileType || !fileName || !fileUrl) {
    sendError(res, 'Thiếu thông tin file. Cần fileType, fileName, fileUrl.', 400);
    return;
  }

  if (!['image', 'video'].includes(fileType)) {
    sendError(res, 'fileType phải là "image" hoặc "video"', 400);
    return;
  }

  // If fileUrl is base64, save to disk instead of DB
  if (fileUrl.startsWith('data:')) {
    const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const ext = fileType === 'video' ? '.mp4' : '.jpg';
      const diskName = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const diskPath = path.join(uploadsDir, diskName);
      fs.writeFileSync(diskPath, Buffer.from(matches[2], 'base64'));
      
      const proof = await prisma.deliveryProof.create({
        data: {
          orderId: req.params.id,
          fileType,
          fileName: fileName || diskName,
          fileUrl: `/uploads/proofs/${diskName}`,
          note: note || null,
          uploadedBy: req.user!.name || req.user!.email,
        },
      });
      sendSuccess(res, proof, 201, 'Upload chứng từ thành công');
      return;
    }
  }

  // Plain URL (already stored externally)
  const proof = await prisma.deliveryProof.create({
    data: {
      orderId: req.params.id,
      fileType,
      fileName,
      fileUrl,
      note: note || null,
      uploadedBy: req.user!.name || req.user!.email,
    },
  });

  sendSuccess(res, proof, 201, 'Upload chứng từ thành công');
});

/** DELETE /api/orders/:id/delivery-proofs/:proofId — Delete a proof */
export const deleteDeliveryProof = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proofId } = req.params;
  
  const proof = await prisma.deliveryProof.findUnique({ where: { id: proofId } });
  if (!proof) { sendError(res, 'Chứng từ không tồn tại', 404); return; }
  if (proof.orderId !== req.params.id) { sendError(res, 'Chứng từ không thuộc đơn hàng này', 400); return; }

  // Delete file from disk if it's a local upload
  if (proof.fileUrl.startsWith('/uploads/proofs/')) {
    const filePath = path.join(__dirname, '..', '..', '..', proof.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await prisma.deliveryProof.delete({ where: { id: proofId } });
  sendSuccess(res, null, 200, 'Đã xóa chứng từ');
});

/** GET /api/orders/:id/delivery-proofs/check — Check if proofs exist (for validation) */
export const checkDeliveryProofs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await prisma.deliveryProof.count({
    where: { orderId: req.params.id },
  });
  sendSuccess(res, { hasProofs: count > 0, count });
});
