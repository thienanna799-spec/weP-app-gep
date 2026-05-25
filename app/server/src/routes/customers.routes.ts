import { Router } from 'express';
import { requireAuth, requireRole, requireActive } from '../middlewares/auth.middleware.js';
import { getCustomers, getCustomer, searchCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerOrders, getCustomerHistory, checkPhone } from '../controllers/customers.controller.js';
import { downloadCustomerTemplate, importCustomers } from '../controllers/customers-import.controller.js';
import { downloadPricingTemplate, importPricing, getCustomerPricing, exportPricing, updatePricingRule, togglePricingRule, addPricingRule, toggleSubSku, getSubSkuStatuses } from '../controllers/customers-pricing.controller.js';
import { getBankAccounts, getDefaultBankAccount, createBankAccount, updateBankAccount, deleteBankAccount } from '../controllers/bank-accounts.controller.js';
import { getCrmProfile, createNote, deleteNote, createFollowUp, updateFollowUp, deleteFollowUp, getActivities } from '../controllers/crm.controller.js';

const router = Router();

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

export default router;
