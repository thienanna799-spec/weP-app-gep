import React, { useState, useRef } from 'react';
import { Package, Truck, AlertTriangle } from 'lucide-react';
import SuppliersTab from './components/SuppliersTab';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import LowStockTab from './components/LowStockTab';

// Simple toast helper
const useToast = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const idRef = useRef(0);
  const show = (message: string, type: 'success' | 'error') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  return {
    success: (msg: string) => show(msg, 'success'),
    error: (msg: string) => show(msg, 'error'),
    toasts,
  };
};

const TABS = [
  { id: 'suppliers', label: 'Nhà cung cấp', icon: Truck },
  { id: 'purchase-orders', label: 'Đơn mua hàng', icon: Package },
  { id: 'low-stock', label: 'NVL sắp hết', icon: AlertTriangle },
] as const;

type TabId = typeof TABS[number]['id'];

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ duyệt',
  approved: 'Đã duyệt',
  ordered: 'Đã đặt hàng',
  partially_received: 'Nhận 1 phần',
  received: 'Đã nhận đủ',
  cancelled: 'Đã hủy',
};

export const PO_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  ordered: 'bg-purple-100 text-purple-700',
  partially_received: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProcurementPage() {
  const toast = useToast();
  const [tab, setTab] = useState<TabId>('suppliers');
  const [lowStockCount, setLowStockCount] = useState(0);

  return (
    <div className="space-y-6 p-6">
      {/* Toast Notifications */}
      {toast.toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
          {toast.toasts.map(t => (
            <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-in ${
              t.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {t.type === 'success' ? '✓ ' : '✗ '}{t.message}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mua hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý nhà cung cấp và đơn mua hàng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
              {t.id === 'low-stock' && lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'suppliers' && <SuppliersTab toast={toast} />}
      {tab === 'purchase-orders' && <PurchaseOrdersTab toast={toast} />}
      {tab === 'low-stock' && <LowStockTab toast={toast} onCountUpdate={setLowStockCount} />}
      
      {/* Hidden instance of LowStockTab to keep the count updated when on other tabs */}
      {tab !== 'low-stock' && (
        <div className="hidden">
          <LowStockTab toast={{ success: () => {}, error: () => {} }} onCountUpdate={setLowStockCount} />
        </div>
      )}
    </div>
  );
}
