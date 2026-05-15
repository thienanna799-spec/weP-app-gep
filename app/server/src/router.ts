import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from './middlewares/auth.middleware.js';

// Controllers
import { googleAuth, getMe } from './controllers/auth.controller.js';
import { getUsers, getUser, updateUserRole, updateUserStatus, deleteUser } from './controllers/users.controller.js';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder, getOrderItems, getOrderLogs } from './controllers/orders/orders.core.controller.js';
import { approveOrder, rejectOrder, cancelOrder, updateOrderStatus } from './controllers/orders/orders.status.controller.js';
import { updatePaymentStatus } from './controllers/orders/orders.payment.controller.js';
import {
  pickRollToOrder, assignDriverToOrder, completeDelivery, failDelivery
} from './controllers/orders.dispatch.controller.js';
import {
  getDeliveryProofs, uploadDeliveryProof, deleteDeliveryProof, checkDeliveryProofs, upload
} from './controllers/delivery-proof.controller.js';
import {
  getMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial,
  getTransactions, createTransaction, getBOM, saveBOM,
} from './controllers/materials.controller.js';
import {
  getProductionOrders, getProductionOrder, createProductionOrder,
  updateProductionOrder, updateProductionOrderStatus, deleteProductionOrder,
} from './controllers/production-orders.controller.js';
import {
  getRolls, getRoll, getRollByQR, createRoll,
  updateRollStatus, scanRollToStock, shipRoll, transferRoll, saveInventoryCheck, getStorageCapacity, deleteRollGroup
} from './controllers/rolls.controller.js';
import {
  getShippingOrders, getShippingOrder, getShippingTracking, createShippingOrder,
  scanRollToShipping, assignDriver, logDeliveryAction, returnShipping,
  previewPickingSlip, downloadPickingSlipPDF, getPickingSlipData
} from './controllers/shipping.controller.js';
import { getMyDriver, updateMyDriver, uploadMyDocuments } from './controllers/drivers/drivers.profile.controller.js';
import { getDrivers, getDriverLeaderboard, getDriver, createDriver, updateDriver, deleteDriver, getDriverStats } from './controllers/drivers/drivers.core.controller.js';
import { updateDriverLocation, getDriverLocations, getAllLocations } from './controllers/drivers/drivers.location.controller.js';
import { getVehicles, getVehicle, createVehicle, updateVehicle, getVehicleMaintenances, addVehicleMaintenance, getAllMaintenances } from './controllers/drivers/drivers.vehicles.controller.js';
import { getFuelLogs, addFuelLog, addRepairLog } from './controllers/drivers/drivers.logs.controller.js';
import {
  getDailyLogs, getMyDailyLogs, checkInDailyLog,
  checkOutDailyLog, addFuelDailyLog, deleteDailyLog,
} from './controllers/daily-logs.controller.js';
import {
  getLoginLogs, createLoginLog, getActivityLogs,
  createActivityLog, getReportsOverview,
} from './controllers/admin.controller.js';
import {
  previewInvoice, downloadInvoicePDF, getInvoiceData, sendInvoiceViaTelegram,
} from './controllers/invoice.controller.js';
import {
  getCustomers, getCustomer, searchCustomers, createCustomer, updateCustomer, deleteCustomer,
  getCustomerOrders, getCustomerHistory, checkPhone,
} from './controllers/customers.controller.js';
import {
  downloadCustomerTemplate, importCustomers,
} from './controllers/customers-import.controller.js';
import {
  downloadPricingTemplate, importPricing, getCustomerPricing, exportPricing, updatePricingRule,
  togglePricingRule, addPricingRule, toggleSubSku, getSubSkuStatuses,
} from './controllers/customers-pricing.controller.js';
import {
  getBankAccounts, getDefaultBankAccount, createBankAccount, updateBankAccount, deleteBankAccount,
} from './controllers/bank-accounts.controller.js';
import {
  getCrmProfile, createNote, deleteNote,
  createFollowUp, updateFollowUp, deleteFollowUp,
  getActivities,
} from './controllers/crm.controller.js';
import {
  getReportSummary, getReportProduction, getReportMaterials,
  getReportInventory, getReportDelivery, getReportCustomers,
  exportReport, getReportFilterOptions,
} from './controllers/reports.controller.js';
import {
  createImportBatch, getImportBatches, getImportBatch, scanManualRoll,
  downloadImportTemplate, importExcel, markBatchDone,
} from './controllers/import-batch.controller.js';
import {
  getStockSummary, syncStock, lookupSubSku, lookupBySku,
} from './controllers/stock-sync.controller.js';
import {
  getProductCatalog, getProductCatalogItem,
} from './controllers/product-catalog.controller.js';
import {
  getContactLogs, createContactLog,
} from './controllers/contact-logs.controller.js';
import {
  getPermissions, updatePermissions,
} from './controllers/permissions.controller.js';
import {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier,
} from './controllers/suppliers.controller.js';
import {
  getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder,
  submitPurchaseOrder, approvePurchaseOrder, markAsOrdered,
  receivePurchaseOrder, cancelPurchaseOrder, deletePurchaseOrder,
  getLowStockMaterials, suggestPurchaseOrder, sendLowStockAlert,
} from './controllers/purchase-orders.controller.js';
import {
  getFinanceSummary, getReceivables, getCustomerReceivable,
  createPayment, getOrderPayments, getPayables,
  checkCredit, sendDebtAlerts,
} from './controllers/finance.controller.js';
import {
  getReturnRequests, getReturnStats, createReturnRequest,
  approveReturn, rejectReturn, resolveReturn,
  getNotifications, getNotificationStats,
} from './controllers/returns.controller.js';
import {
  getTransfers, createTransfer, getStocktakes, getStocktake, createStocktake, addStocktakeItem, completeStocktake, exportInventory,
} from './controllers/inventory.controller.js';
import { runOcrAudit } from './controllers/ocr-webhook.controller.js';
import { getOcrAudits, getOcrAudit, reviewOcrAudit, getOcrAuditStats } from './controllers/ocr-audit.controller.js';

const router = Router();

// ── Health ──────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Auth ────────────────────────────────────────────────
router.post('/auth/google', googleAuth);
router.get('/me', requireAuth, requireActive, getMe);

// ── Users ───────────────────────────────────────────────
router.get('/users', requireAuth, requireActive, requireRole('super_admin', 'admin'), getUsers);
router.get('/users/:uid', requireAuth, requireActive, getUser);
router.put('/users/:uid/role', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateUserRole);
router.put('/users/:uid/status', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateUserStatus);
router.delete('/users/:uid', requireAuth, requireActive, requireRole('super_admin'), deleteUser);

// ── Orders ──────────────────────────────────────────────
router.get('/orders', requireAuth, requireActive, getOrders);
router.get('/orders/:id', requireAuth, requireActive, getOrder);
router.post('/orders', requireAuth, requireActive, createOrder);
router.put('/orders/:id', requireAuth, requireActive, updateOrder);
router.put('/orders/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approveOrder);
router.put('/orders/:id/reject', requireAuth, requireActive, requireRole('super_admin', 'admin'), rejectOrder);
router.put('/orders/:id/cancel', requireAuth, requireActive, cancelOrder);
router.put('/orders/:id/status', requireAuth, requireActive, updateOrderStatus);
router.delete('/orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteOrder);
router.post('/orders/:id/pick-roll', requireAuth, requireActive, pickRollToOrder);
router.post('/orders/:id/assign-driver', requireAuth, requireActive, assignDriverToOrder);
router.post('/orders/:id/complete-delivery', requireAuth, requireActive, completeDelivery);
router.post('/orders/:id/fail-delivery', requireAuth, requireActive, failDelivery);
router.get('/orders/:id/items', requireAuth, requireActive, getOrderItems);
router.get('/orders/:id/logs', requireAuth, requireActive, getOrderLogs);
router.put('/orders/:id/payment-status', requireAuth, requireActive, updatePaymentStatus);
router.get('/orders/:id/delivery-proofs', requireAuth, requireActive, getDeliveryProofs);
router.post('/orders/:id/delivery-proofs', requireAuth, requireActive, upload.single('file'), uploadDeliveryProof);
router.delete('/orders/:id/delivery-proofs/:proofId', requireAuth, requireActive, deleteDeliveryProof);
router.get('/orders/:id/delivery-proofs/check', requireAuth, requireActive, checkDeliveryProofs);
router.get('/orders/:id/contact-logs', requireAuth, requireActive, getContactLogs);
router.post('/orders/:id/contact-logs', requireAuth, requireActive, createContactLog);

// ── Materials ───────────────────────────────────────────
router.get('/materials', requireAuth, requireActive, getMaterials);
router.get('/materials/transactions', requireAuth, requireActive, getTransactions);
router.post('/materials/transactions', requireAuth, requireActive, createTransaction);
router.get('/materials/bom/:productId', requireAuth, requireActive, getBOM);
router.post('/materials/bom', requireAuth, requireActive, saveBOM);
router.get('/materials/low-stock', requireAuth, requireActive, getLowStockMaterials);
router.get('/materials/:id', requireAuth, requireActive, getMaterial);
router.post('/materials', requireAuth, requireActive, createMaterial);
router.put('/materials/:id', requireAuth, requireActive, updateMaterial);
router.delete('/materials/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteMaterial);

// ── Production Orders ───────────────────────────────────
router.get('/production-orders', requireAuth, requireActive, getProductionOrders);
router.get('/production-orders/:id', requireAuth, requireActive, getProductionOrder);
router.post('/production-orders', requireAuth, requireActive, createProductionOrder);
router.put('/production-orders/:id', requireAuth, requireActive, updateProductionOrder);
router.put('/production-orders/:id/status', requireAuth, requireActive, updateProductionOrderStatus);
router.delete('/production-orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteProductionOrder);

// ── Rolls / Inventory ───────────────────────────────────
router.get('/rolls', requireAuth, requireActive, getRolls);
router.get('/rolls/qr/:qrCode', requireAuth, requireActive, getRollByQR);
router.get('/rolls/:id', requireAuth, requireActive, getRoll);
router.post('/rolls', requireAuth, requireActive, createRoll);
router.put('/rolls/:id/status', requireAuth, requireActive, updateRollStatus);
router.put('/rolls/:id/scan-to-stock', requireAuth, requireActive, scanRollToStock);
router.put('/rolls/:id/ship', requireAuth, requireActive, shipRoll);
router.put('/rolls/:id/transfer', requireAuth, requireActive, transferRoll);
router.post('/rolls/inventory-check', requireAuth, requireActive, saveInventoryCheck);
router.get('/inventory/storage-capacity', requireAuth, requireActive, getStorageCapacity);
router.get('/inventory/export', requireAuth, requireActive, exportInventory);
router.delete('/inventory/rolls/group', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteRollGroup);

// ── Manual Import ───────────────────────────────────────
router.post('/inventory/import-batch', requireAuth, requireActive, createImportBatch);
router.get('/inventory/import-batch', requireAuth, requireActive, getImportBatches);
router.get('/inventory/import-batch/:id', requireAuth, requireActive, getImportBatch);
router.post('/inventory/import-batch/:id/done', requireAuth, requireActive, markBatchDone);
router.post('/inventory/scan-manual', requireAuth, requireActive, scanManualRoll);
router.get('/inventory/import-template', requireAuth, requireActive, downloadImportTemplate);
router.post('/inventory/import-excel', requireAuth, requireActive, importExcel);

// ── Stock Sync (Tổng hợp tồn) ──────────────────────────
router.get('/inventory/stock-summary', requireAuth, requireActive, getStockSummary);
router.post('/inventory/sync-stock', requireAuth, requireActive, syncStock);
router.get('/inventory/lookup-subsku', requireAuth, requireActive, lookupSubSku);
router.get('/inventory/by-sku', requireAuth, requireActive, lookupBySku);

// ── Product Catalog (Tổng sản phẩm) ────────────────────
router.get('/inventory/products', requireAuth, requireActive, getProductCatalog);
router.get('/inventory/products/:id', requireAuth, requireActive, getProductCatalogItem);

// ── Shipping ────────────────────────────────────────────
router.get('/shipping', requireAuth, requireActive, getShippingOrders);
router.get('/shipping/:id', requireAuth, requireActive, getShippingOrder);
router.get('/shipping/:id/tracking', requireAuth, requireActive, getShippingTracking);
router.post('/shipping', requireAuth, requireActive, createShippingOrder);
router.post('/shipping/:id/scan', requireAuth, requireActive, scanRollToShipping);
router.put('/shipping/:id/assign-driver', requireAuth, requireActive, assignDriver);
router.post('/shipping/:id/delivery-log', requireAuth, requireActive, logDeliveryAction);
router.put('/shipping/:id/return', requireAuth, requireActive, returnShipping);
router.get('/shipping/:id/picking-slip/preview', requireAuth, requireActive, previewPickingSlip);
router.get('/shipping/:id/picking-slip/pdf', requireAuth, requireActive, downloadPickingSlipPDF);
router.get('/shipping/:id/picking-slip/data', requireAuth, requireActive, getPickingSlipData);

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

// ── Admin / Reports ─────────────────────────────────────
router.get('/admin/login-logs', requireAuth, requireActive, requireRole('super_admin', 'admin'), getLoginLogs);
router.post('/admin/login-logs', requireAuth, requireActive, createLoginLog);
router.get('/admin/activity-logs', requireAuth, requireActive, requireRole('super_admin', 'admin'), getActivityLogs);
router.post('/admin/activity-logs', requireAuth, requireActive, createActivityLog);
router.get('/admin/reports/overview', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReportsOverview);

// ── Permissions (role matrix) ───────────────────────────
router.get('/admin/permissions', requireAuth, requireActive, getPermissions);
router.put('/admin/permissions', requireAuth, requireActive, requireRole('super_admin'), updatePermissions);

// ── Reports & Analytics ─────────────────────────────────
router.get('/reports/filters', requireAuth, requireActive, getReportFilterOptions);
router.get('/reports/summary', requireAuth, requireActive, getReportSummary);
router.get('/reports/production', requireAuth, requireActive, getReportProduction);
router.get('/reports/materials', requireAuth, requireActive, getReportMaterials);
router.get('/reports/inventory', requireAuth, requireActive, getReportInventory);
router.get('/reports/delivery', requireAuth, requireActive, getReportDelivery);
router.get('/reports/customers', requireAuth, requireActive, getReportCustomers);
router.get('/reports/export/:type', requireAuth, requireActive, exportReport);

// ── Invoices ────────────────────────────────────────────
router.get('/invoices/:orderId/preview', requireAuth, requireActive, previewInvoice);
router.get('/invoices/:orderId/pdf', requireAuth, requireActive, downloadInvoicePDF);
router.get('/invoices/:orderId/data', requireAuth, requireActive, getInvoiceData);
router.post('/invoices/:orderId/send-telegram', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendInvoiceViaTelegram);

// ── Customers ───────────────────────────────────────────
router.get('/customers', requireAuth, requireActive, getCustomers);
router.get('/customers/search', requireAuth, requireActive, searchCustomers);
router.get('/customers/import-template', requireAuth, requireActive, downloadCustomerTemplate);
router.get('/customers/pricing-template', requireAuth, requireActive, downloadPricingTemplate);
router.get('/customers/export-pricing', requireAuth, requireActive, exportPricing);
router.post('/customers/import-excel', requireAuth, requireActive, importCustomers);
router.post('/customers/import-pricing', requireAuth, requireActive, importPricing);
router.put('/customers/pricing/:pricingId', requireAuth, requireActive, updatePricingRule);
router.patch('/customers/pricing/:pricingId/toggle', requireAuth, requireActive, togglePricingRule);
router.post('/customers/check-phone', requireAuth, requireActive, checkPhone);
router.post('/customers', requireAuth, requireActive, createCustomer);
// ── Customers :id routes (MUST be after specific paths) ──
router.get('/customers/:id', requireAuth, requireActive, getCustomer);
router.get('/customers/:id/orders', requireAuth, requireActive, getCustomerOrders);
router.get('/customers/:id/history', requireAuth, requireActive, getCustomerHistory);
router.get('/customers/:id/pricing', requireAuth, requireActive, getCustomerPricing);
router.post('/customers/:id/pricing', requireAuth, requireActive, addPricingRule);
router.patch('/customers/:id/subsku-toggle', requireAuth, requireActive, toggleSubSku);
router.get('/customers/:id/subsku-status', requireAuth, requireActive, getSubSkuStatuses);
router.put('/customers/:id', requireAuth, requireActive, updateCustomer);
router.delete('/customers/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteCustomer);

// ── Bank Accounts ───────────────────────────────────────
router.get('/bank-accounts', requireAuth, requireActive, getBankAccounts);
router.get('/bank-accounts/default', requireAuth, requireActive, getDefaultBankAccount);
router.post('/bank-accounts', requireAuth, requireActive, requireRole('super_admin', 'admin'), createBankAccount);
router.put('/bank-accounts/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateBankAccount);
router.delete('/bank-accounts/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), deleteBankAccount);

// ── CRM ─────────────────────────────────────────────────
router.get('/customers/:id/crm', requireAuth, requireActive, getCrmProfile);
router.post('/customers/:id/notes', requireAuth, requireActive, createNote);
router.delete('/customers/:id/notes/:noteId', requireAuth, requireActive, deleteNote);
router.post('/customers/:id/follow-ups', requireAuth, requireActive, createFollowUp);
router.put('/customers/:id/follow-ups/:followUpId', requireAuth, requireActive, updateFollowUp);
router.delete('/customers/:id/follow-ups/:followUpId', requireAuth, requireActive, deleteFollowUp);
router.get('/customers/:id/activities', requireAuth, requireActive, getActivities);

// ── Suppliers ───────────────────────────────────────────
router.get('/suppliers', requireAuth, requireActive, getSuppliers);
router.get('/suppliers/:id', requireAuth, requireActive, getSupplier);
router.post('/suppliers', requireAuth, requireActive, requireRole('super_admin', 'admin'), createSupplier);
router.put('/suppliers/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), updateSupplier);
router.delete('/suppliers/:id', requireAuth, requireActive, requireRole('super_admin'), deleteSupplier);

// ── Purchase Orders ─────────────────────────────────────
router.get('/purchase-orders', requireAuth, requireActive, getPurchaseOrders);
router.get('/purchase-orders/:id', requireAuth, requireActive, getPurchaseOrder);
router.post('/purchase-orders', requireAuth, requireActive, requireRole('super_admin', 'admin'), createPurchaseOrder);
router.put('/purchase-orders/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), updatePurchaseOrder);
router.put('/purchase-orders/:id/submit', requireAuth, requireActive, requireRole('super_admin', 'admin'), submitPurchaseOrder);
router.put('/purchase-orders/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approvePurchaseOrder);
router.put('/purchase-orders/:id/order', requireAuth, requireActive, requireRole('super_admin', 'admin'), markAsOrdered);
router.put('/purchase-orders/:id/receive', requireAuth, requireActive, requireRole('super_admin', 'admin'), receivePurchaseOrder);
router.put('/purchase-orders/:id/cancel', requireAuth, requireActive, requireRole('super_admin', 'admin'), cancelPurchaseOrder);
router.delete('/purchase-orders/:id', requireAuth, requireActive, requireRole('super_admin'), deletePurchaseOrder);

// ── Materials: Suggest PO ───────────────────────────────
router.post('/materials/:id/suggest-po', requireAuth, requireActive, requireRole('super_admin', 'admin'), suggestPurchaseOrder);
router.post('/materials/low-stock/alert', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendLowStockAlert);

// ── Finance ──────────────────────────────────────────
router.get('/finance/summary', requireAuth, requireActive, requireRole('super_admin', 'admin'), getFinanceSummary);
router.get('/finance/receivables', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReceivables);
router.get('/finance/receivables/:customerId', requireAuth, requireActive, requireRole('super_admin', 'admin'), getCustomerReceivable);
router.post('/finance/payments', requireAuth, requireActive, requireRole('super_admin', 'admin'), createPayment);
router.get('/finance/payments/:orderId', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOrderPayments);
router.get('/finance/payables', requireAuth, requireActive, requireRole('super_admin', 'admin'), getPayables);
router.get('/finance/credit-check/:customerId', requireAuth, requireActive, requireRole('super_admin', 'admin'), checkCredit);
router.post('/finance/debt-alerts', requireAuth, requireActive, requireRole('super_admin', 'admin'), sendDebtAlerts);

// ── Returns ─────────────────────────────────────────────
router.get('/returns/stats', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReturnStats);
router.get('/returns', requireAuth, requireActive, requireRole('super_admin', 'admin'), getReturnRequests);
router.post('/returns', requireAuth, requireActive, requireRole('super_admin', 'admin'), createReturnRequest);
router.patch('/returns/:id/approve', requireAuth, requireActive, requireRole('super_admin', 'admin'), approveReturn);
router.patch('/returns/:id/reject', requireAuth, requireActive, requireRole('super_admin', 'admin'), rejectReturn);
router.patch('/returns/:id/resolve', requireAuth, requireActive, requireRole('super_admin', 'admin'), resolveReturn);

// ── Notifications ───────────────────────────────────────
router.get('/notifications/stats', requireAuth, requireActive, getNotificationStats);
router.get('/notifications', requireAuth, requireActive, getNotifications);

// ── Webhooks ────────────────────────────────────────────
// Note: Normally webhooks might have different auth, but we leave it open or require standard auth depending on caller
router.post('/webhooks/ocr/audit', runOcrAudit);

// ── OCR Audit Dashboard ──────────────────────────────────
router.get('/ocr-audit/stats', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAuditStats);
router.get('/ocr-audit', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAudits);
router.get('/ocr-audit/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), getOcrAudit);
router.patch('/ocr-audit/:id/review', requireAuth, requireActive, requireRole('super_admin', 'admin'), reviewOcrAudit);

// ── Advanced Inventory ──────────────────────────────────
router.get('/inventory/transfers', requireAuth, requireActive, requireRole('super_admin', 'admin', 'staff'), getTransfers);
router.post('/inventory/transfers', requireAuth, requireActive, requireRole('super_admin', 'admin', 'staff'), createTransfer);
router.get('/inventory/stocktakes', requireAuth, requireActive, requireRole('super_admin', 'admin'), getStocktakes);
router.post('/inventory/stocktakes', requireAuth, requireActive, requireRole('super_admin', 'admin'), createStocktake);
router.get('/inventory/stocktakes/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), getStocktake);
router.post('/inventory/stocktakes/items