/**
 * useOrderCreateForm — State & logic for order creation modal
 */
import { useState, useEffect, useRef } from 'react';
import { Order } from '../../../types/order.types';
import { bankAccountService } from '../../customers/services/customer.service';
import { BankAccount } from '../../customers/types';
import { inventoryService } from '../../inventory/services/inventory.service';
import api from '../../../services/api';

interface SubSkuResult {
  subSku: string; sku: string; productName: string; specification: string; supplier: string;
}
interface PricingRule { sku: string; price: number; isActive: boolean; }

export interface OrderFormItem {
  subSku: string; sku: string; productName: string; specification: string;
  quantity: number; unitPrice: number; unit: string; tonKho: number;
}

const defaultForm = (): Partial<Order> => ({
  code: `ORD-${Date.now().toString().slice(-6)}`,
  customerName: '', customerPhone: '', customerAddress: '', customerEmail: '',
  note: '', status: 'cho_duyet', priority: 'trung_binh', quantity: 0,
  paymentMethod: 'bank_transfer',
} as any);

export function useOrderCreateForm(isOpen: boolean) {
  const [formData, setFormData] = useState<Partial<Order>>(defaultForm());
  const [formItems, setFormItems] = useState<OrderFormItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [customerPricing, setCustomerPricing] = useState<PricingRule[]>([]);
  const pricingRef = useRef<PricingRule[]>([]);
  const customerIdRef = useRef<string>('');

  const [skuSearchIdx, setSkuSearchIdx] = useState<number | null>(null);
  const [skuResults, setSkuResults] = useState<SubSkuResult[]>([]);
  const [skuSearching, setSkuSearching] = useState(false);
  const [autoPopLoading, setAutoPopLoading] = useState(false);
  const [autoPopCount, setAutoPopCount] = useState(0);
  const skuTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      bankAccountService.getAll().then(setBankAccounts).catch(() => {});
      setFormData(defaultForm());
      setFormItems([]);
      setCustomerPricing([]);
      pricingRef.current = [];
      customerIdRef.current = '';
    }
  }, [isOpen]);

  const selectCustomer = async (c: any) => {
    customerIdRef.current = c.id;
    setAutoPopLoading(true);
    setAutoPopCount(0);
    setFormData(prev => ({
      ...prev, customerName: c.name, customerPhone: c.phone,
      customerEmail: c.email || '', customerAddress: c.address || '',
      customerId: c.id, paymentMethod: 'bank_transfer',
      bankAccountNumber: c.bankAccountNumber || '',
      bankName: c.bankName || '', bankAccountHolder: c.bankAccountHolder || '',
    }));
    // Auto-select default bank account
    const defBank = bankAccounts.find(b => b.isDefault) || bankAccounts[0];
    if (defBank) {
      setFormData(prev => ({
        ...prev,
        bankAccountId: defBank.id,
        bankName: defBank.bankName,
        bankAccountNumber: defBank.accountNumber,
        bankAccountHolder: defBank.accountHolder,
      }));
    }
    try {
      // 1. Load customer pricing
      const pricing: PricingRule[] = await api.get(`/customers/${c.id}/pricing`);
      setCustomerPricing(pricing); pricingRef.current = pricing;

      // Filter only active pricing rules (SKU-level)
      const activePricing = pricing.filter(p => p.isActive !== false);

      if (activePricing.length > 0) {
        // 2. Get disabled SUB-SKUs for this customer
        const subSkuStatuses: { subSku: string; isActive: boolean }[] =
          await api.get(`/customers/${c.id}/subsku-status`);
        const disabledSubSkus = new Set(subSkuStatuses.filter(s => !s.isActive).map(s => s.subSku));

        // 3. Get all SKUs from active pricing → fetch matching SUB-SKUs from inventory
        const skuList = activePricing.map(p => p.sku).filter(Boolean);
        const inventoryItems: { subSku: string; sku: string; productName: string; specification: string; supplier: string; tonKho: number }[] =
          await api.get(`/inventory/by-sku?skus=${encodeURIComponent(skuList.join(','))}`);

        // 4. Build form items: filter out disabled SUB-SKUs
        const newItems: OrderFormItem[] = inventoryItems
          .filter(inv => !disabledSubSkus.has(inv.subSku))
          .map(inv => {
            const rule = activePricing.find(p => p.sku.toUpperCase() === (inv.sku || '').toUpperCase());
            return {
              subSku: inv.subSku || '',
              sku: inv.sku || '',
              productName: inv.productName || '',
              specification: inv.specification || '',
              quantity: 0,
              unitPrice: rule ? rule.price : 0,
              unit: 'cu\u1ED9n',
              tonKho: inv.tonKho || 0,
            };
          });

        setFormItems(newItems);
        setAutoPopCount(newItems.length);
      } else {
        setFormItems([]);
        setAutoPopCount(0);
      }
    } catch {
      setCustomerPricing([]); pricingRef.current = [];
    } finally {
      setAutoPopLoading(false);
    }
  };

  const addFormItem = () => setFormItems(prev => [...prev, {
    subSku: '', sku: '', productName: '', specification: '', quantity: 1, unitPrice: 0, unit: 'cu\u1ED9n', tonKho: 0,
  }]);

  const removeFormItem = (idx: number) => setFormItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubSkuChange = (idx: number, val: string) => {
    setFormItems(prev => prev.map((item, i) => i === idx ? { ...item, subSku: val } : item));
    setSkuSearchIdx(idx);
    if (skuTimerRef.current) clearTimeout(skuTimerRef.current);
    if (val.trim().length < 2) { setSkuResults([]); return; }
    setSkuSearching(true);
    skuTimerRef.current = setTimeout(async () => {
      try { setSkuResults(await inventoryService.lookupSubSku(val.trim())); }
      catch { setSkuResults([]); }
      finally { setSkuSearching(false); }
    }, 300);
  };

  const selectSubSku = async (idx: number, result: SubSkuResult) => {
    let pricing = pricingRef.current;
    const custId = customerIdRef.current;
    if (pricing.length === 0 && custId) {
      try { pricing = await api.get(`/customers/${custId}/pricing`); setCustomerPricing(pricing); pricingRef.current = pricing; } catch {}
    }
    const sku = (result.sku || '').trim();
    const rule = pricing.find(p => p.sku.trim().toUpperCase() === sku.toUpperCase());
    setFormItems(prev => prev.map((item, i) => i === idx ? {
      ...item, subSku: result.subSku || '', sku, productName: result.productName || '',
      specification: result.specification || '', unitPrice: rule ? rule.price : item.unitPrice,
    } : item));
    setSkuResults([]); setSkuSearchIdx(null);
  };

  return {
    formData, setFormData, formItems, setFormItems, bankAccounts,
    skuSearchIdx, setSkuSearchIdx, skuResults, skuSearching,
    autoPopLoading, autoPopCount,
    selectCustomer, addFormItem, removeFormItem,
    handleSubSkuChange, selectSubSku,
  };
}
