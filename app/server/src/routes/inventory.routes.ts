import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getRolls, getRoll, getRollByQR, createRoll, getRollHistory, getRollTimelineByQR, updateRollStatus, scanRollToStock, shipRoll, transferRoll, saveInventoryCheck, getStorageCapacity, deleteRollGroup } from '../controllers/rolls.controller.js';
import { createImportBatch, getImportBatches, getImportBatch, scanManualRoll, downloadImportTemplate, importExcel, markBatchDone } from '../controllers/import-batch.controller.js';
import { getStockSummary, lookupSubSku, getInventoryBySku } from '../controllers/stock.summary.controller.js';
import { syncStock } from '../controllers/stock.excel.controller.js';
import { updateMinStock, updateProductInfo, getProductPricing } from '../controllers/stock.product.controller.js';
import { getProductCatalog, getProductCatalogItem } from '../controllers/product-catalog.controller.js';
import { getTransfers, createTransfer, getStocktakes, getStocktake, createStocktake, addStocktakeItem, completeStocktake, exportInventory } from '../controllers/inventory.controller.js';

const router = Router();

// ── Rolls / Inventory ───────────────────────────────────
router.get('/rolls', requireAuth, requireActive, getRolls);
router.get('/rolls/history', requireAuth, requireActive, getRollHistory);
router.get('/rolls/qr/:qrCode/timeline', requireAuth, requireActive, getRollTimelineByQR);
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
router.put('/inventory/stock-summary/:subSku/min-stock', requireAuth, requireActive, updateMinStock);
router.put('/inventory/product-info', requireAuth, requireActive, updateProductInfo);
router.get('/inventory/product-pricing', requireAuth, requireActive, getProductPricing);
router.post('/inventory/sync-stock', requireAuth, requireActive, syncStock);
router.get('/inventory/lookup-subsku', requireAuth, requireActive, lookupSubSku);
router.get('/inventory/by-sku', requireAuth, requireActive, getInventoryBySku);

// ── Product Catalog (Tổng sản phẩm) ────────────────────
router.get('/inventory/products', requireAuth, requireActive, getProductCatalog);
router.get('/inventory/products/:id', requireAuth, requireActive, getProductCatalogItem);

// ── Advanced Inventory ──────────────────────────────────
router.get('/inventory/transfers', requireAuth, requireActive, requireRole('super_admin', 'admin', 'staff'), getTransfers);
router.post('/inventory/transfers', requireAuth, requireActive, requireRole('super_admin', 'admin', 'staff'), createTransfer);
router.get('/inventory/stocktakes', requireAuth, requireActive, requireRole('super_admin', 'admin'), getStocktakes);
router.post('/inventory/stocktakes', requireAuth, requireActive, requireRole('super_admin', 'admin'), createStocktake);
router.get('/inventory/stocktakes/:id', requireAuth, requireActive, requireRole('super_admin', 'admin'), getStocktake);
router.post('/inventory/stocktakes/:id/items', requireAuth, requireActive, requireRole('super_admin', 'admin'), addStocktakeItem);
router.post('/inventory/stocktakes/:id/complete', requireAuth, requireActive, requireRole('super_admin', 'admin'), completeStocktake);

export default router;
