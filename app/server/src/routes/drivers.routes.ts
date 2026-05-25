import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getMyDriver, updateMyDriver, uploadMyDocuments } from '../controllers/drivers/drivers.profile.controller.js';
import { getDrivers, getDriverLeaderboard, getDriver, createDriver, updateDriver, deleteDriver, getDriverStats } from '../controllers/drivers/drivers.core.controller.js';
import { updateDriverLocation, getDriverLocations, getAllLocations } from '../controllers/drivers/drivers.location.controller.js';
import { getVehicles, getVehicle, createVehicle, updateVehicle, getVehicleMaintenances, addVehicleMaintenance, getAllMaintenances } from '../controllers/drivers/drivers.vehicles.controller.js';
import { getFuelLogs, addFuelLog, addRepairLog } from '../controllers/drivers/drivers.logs.controller.js';
import { getDailyLogs, getMyDailyLogs, checkInDailyLog, checkOutDailyLog, addFuelDailyLog, deleteDailyLog } from '../controllers/daily-logs.controller.js';

const router = Router();

// ── Drivers ─────────────────────────────────────────────
// Self-service endpoints (must come before :id routes)
router.get('/drivers/me', requireAuth, requireActive, getMyDriver);
router.put('/drivers/me', requireAuth, requireActive, updateMyDriver);
router.post('/drivers/me/documents', requireAuth, requireActive, uploadMyDocuments);
router.get('/drivers/leaderboard', requireAuth, requireActive, getDriverLeaderboard);

router.get('/drivers', requireAuth, requireActive, getDrivers);
router.get('/drivers/locations', requireAuth, requireActive, getAllLocations);
router.get('/drivers/:id', requireAuth, requireActive, getDriver);
router.post('/drivers', requireAuth, requireActive, createDriver);
router.put('/drivers/:id', requireAuth, requireActive, updateDriver);
router.delete('/drivers/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteDriver);
router.put('/drivers/:id/location', requireAuth, requireActive, updateDriverLocation);
router.get('/drivers/:id/locations', requireAuth, requireActive, getDriverLocations);
router.get('/drivers/:id/stats', requireAuth, requireActive, getDriverStats);

// ── Vehicles ────────────────────────────────────────────
router.get('/vehicles', requireAuth, requireActive, getVehicles);
router.get('/vehicles/:id', requireAuth, requireActive, getVehicle);
router.post('/vehicles', requireAuth, requireActive, createVehicle);
router.put('/vehicles/:id', requireAuth, requireActive, updateVehicle);
router.get('/vehicles/:id/maintenances', requireAuth, requireActive, getVehicleMaintenances);
router.post('/vehicles/:id/maintenances', requireAuth, requireActive, addVehicleMaintenance);

// ── Fuel Logs & Repair Logs ──────────────────────────────────────
router.get('/fuel-logs', requireAuth, requireActive, getFuelLogs);
router.post('/fuel-logs', requireAuth, requireActive, addFuelLog);
router.post('/repair-logs', requireAuth, requireActive, addRepairLog);

// ── Global Maintenances ────────────────────────────────────────
router.get('/maintenances', requireAuth, requireActive, getAllMaintenances);

// ── Daily Vehicle Logs ──────────────────────────────────
router.get('/daily-logs', requireAuth, requireActive, getDailyLogs);
router.get('/daily-logs/me', requireAuth, requireActive, getMyDailyLogs);
router.post('/daily-logs/check-in', requireAuth, requireActive, checkInDailyLog);
router.put('/daily-logs/:id/check-out', requireAuth, requireActive, checkOutDailyLog);
router.post('/daily-logs/fuel', requireAuth, requireActive, addFuelDailyLog);
router.delete('/daily-logs/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteDailyLog);

export default router;
 
