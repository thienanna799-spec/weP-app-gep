import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { verifyFirebaseToken } from '../lib/firebase-admin.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEFAULT_ADMIN_EMAIL = 'bachsydonggiphn@gmail.com';

const signJwt = (payload: object) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

/**
 * POST /api/auth/google
 * Accepts a Firebase ID token, upserts user in DB, returns JWT
 */
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };

  if (!idToken) {
    sendError(res, 'idToken is required', 400);
    return;
  }

  // Try to verify Firebase token
  let firebaseUid: string;
  let email: string;
  let name: string;
  let avatar: string;

  const decoded = await verifyFirebaseToken(idToken);

  if (decoded) {
    firebaseUid = decoded.uid;
    email = decoded.email || '';
    name = decoded.name || decoded.email || 'User';
    avatar = decoded.picture || '';
  } else {
    // Fallback: trust the body (for dev when serviceAccount.json is missing)
    const body = req.body as { email?: string; name?: string; avatar?: string; uid?: string };
    if (!body.email || !body.uid) {
      sendError(res, 'Firebase token verification failed. Provide uid and email in body for dev mode.', 401);
      return;
    }
    firebaseUid = body.uid;
    email = body.email;
    name = body.name || email;
    avatar = body.avatar || '';
    console.warn('⚠️  Using fallback auth (no serviceAccount.json). Do NOT use in production.');
  }

  // Determine role
  const isDefaultAdmin = email === DEFAULT_ADMIN_EMAIL;
  const isFromDriverApp = req.headers['x-client-app'] === 'DriverGo';

  // Find existing user by uid OR by email (handles seed data vs real Firebase uid conflict)
  let user = await prisma.user.findFirst({
    where: { OR: [{ uid: firebaseUid }, { email }] },
  });

  if (user) {
    // Update existing user — if they had a seed uid, update to real Firebase uid
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        uid: firebaseUid,   // Always sync to real Firebase uid
        email,
        name,
        avatar,
        lastLoginAt: new Date(),
        ...(isDefaultAdmin ? { role: 'super_admin', status: 'active' } : {}),
      },
    });
  } else {
    // New user — create with pending role (admin must approve before driver can work)
    user = await prisma.user.create({
      data: {
        uid: firebaseUid,
        email,
        name,
        avatar,
        role: isDefaultAdmin ? 'super_admin' : 'pending',
        status: 'active',
      },
    });
  }

  // ── Auto-create Driver record for APK registrations ──────────────────────────
  if (isFromDriverApp) {
    try {
      const existingDriver = await prisma.driver.findFirst({ where: { userId: user.uid } });
      if (!existingDriver) {
        await prisma.driver.create({
          data: {
            userId: user.uid,
            code: `DRV-${Date.now().toString().slice(-6)}`,
            name: user.name,
            phone: user.phone || '',
            email: user.email,
            address: '',
            dob: '',
            idCard: '',
            licenseNo: '',
            licenseType: '',
            licenseExpiry: '',
            joinedDate: new Date().toISOString().split('T')[0],
            status: 'inactive',  // inactive until admin approves
          },
        });
        console.log(`🚗 Auto-created Driver record for APK user: ${user.email}`);
      }
    } catch (driverErr: any) {
      console.error('Failed to auto-create driver record:', driverErr.message);
    }
  }

  // Log login
  try {
    await prisma.userLoginLog.create({
      data: {
        userId: user.uid,
        email: user.email,
        userAgent: req.headers['user-agent'] || '',
        status: user.status === 'blocked' ? 'blocked' : 'success',
      },
    });
  } catch {}

  if (user.status === 'blocked') {
    sendError(res, 'Account is blocked', 403);
    return;
  }

  const token = signJwt({
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  });

  // ── Notify web app about user login/registration via Socket.IO ──────────────
  const io = req.app.get('io');
  if (io) {
    io.emit('user_updated', {
      type: 'login',
      user: { uid: user.uid, email: user.email, name: user.name, role: user.role },
      source: isFromDriverApp ? 'apk' : 'web',
    });
  }

  sendSuccess(res, { token, user }, 200, 'Login successful');
});

/**
 * GET /api/me
 * Returns current user profile from DB using the JWT uid
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { uid: req.user!.uid } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  // Include driver record if exists (for APK status check)
  const driver = await prisma.driver.findFirst({ where: { userId: user.uid } }).catch(() => null);
  
  sendSuccess(res, { ...user, driver: driver || null });
});
