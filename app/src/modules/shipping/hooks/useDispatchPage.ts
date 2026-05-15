/**
 * useDispatchPage — All state & handlers for the Dispatch Center
 * ──────────────────────────────────────────────────────────────
 * Extracts 20+ useState, API calls, socket integration, and 8 handlers
 * from the monolithic page.tsx.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

type ViewFilter = 'all' | 'preparing' | 'ready' | 'delivering' | 'completed';

const PIPELINE_STATUSES = ['da_duyet', 'dang_chuan_bi', 'cho_xuat_kho', 'dang_giao', 'hoan_thanh'];

export function useDispatchPage() {
  const { t } = useTranslation();

  // ── Core data ─────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [shippingOrders, setShippingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<any[]>([]);

  // ── UI state ──────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Assign driver form ────────────────────────────
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // ── Invoice ───────────────────────────────────────
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState('');
  const [invoiceOrderCode, setInvoiceOrderCode] = useState('');

  // ── Picking Slip ──────────────────────────────────
  const [pickingSlipOpen, setPickingSlipOpen] = useState(false);
  const [pickingSlipShippingId, setPickingSlipShippingId] = useState('');
  const [pickingSlipShippingCode, setPickingSlipShippingCode] = useState('');

  // ── Delivery proof ────────────────────────────────
  const [hasProofs, setHasProofs] = useState(false);
  const [downloadingProofs, setDownloadingProofs] = useState(false);

  // ── Data fetching ─────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [ordersData, shippingData, driversData] = await Promise.all([
        api.get<any[]>('/orders'),
        api.get<any[]>('/shipping'),
        api.get<any[]>('/drivers').catch(() => []),
      ]);
      setOrders(ordersData.filter(o => PIPELINE_STATUSES.includes(o.status)));
      setShippingOrders(shippingData);
      setDrivers(driversData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Debounced refresh for socket events
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => fetchAll(), 500);
  }, [fetchAll]);

  useSocket({
    onOrderUpdate: () => debouncedRefresh(),
    onShippingUpdate: () => { debouncedRefresh(); if (selectedOrderId) fetchDetail(selectedOrderId); },
    onInventoryUpdate: () => debouncedRefresh(),
    onDriverVehicleUpdate: () => debouncedRefresh(),
  });

  // ── KPI + Filters ────────────────────────────────
  const kpis = useMemo(() => ({
    preparing: orders.filter(o => ['da_duyet', 'dang_chuan_bi'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'cho_xuat_kho').length,
    delivering: orders.filter(o => o.status === 'dang_giao').length,
    completed: orders.filter(o => o.status === 'hoan_thanh').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (viewFilter === 'preparing') filtered = orders.filter(o => ['da_duyet', 'dang_chuan_bi'].includes(o.status));
    else if (viewFilter === 'ready') filtered = orders.filter(o => o.status === 'cho_xuat_kho');
    else if (viewFilter === 'delivering') filtered = orders.filter(o => o.status === 'dang_giao');
    else if (viewFilter === 'completed') filtered = orders.filter(o => o.status === 'hoan_thanh');
    return filtered.filter(o =>
      (o.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, viewFilter, searchTerm]);

  // ── Detail fetching ───────────────────────────────
  const fetchDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const order = await api.get<any>(`/orders/${orderId}`);
      const shipping = shippingOrders.find(s => s.orderId === orderId);
      setSelectedOrder({ ...order, shippingOrder: shipping || null });
      if (shipping) {
        try {
          const tracking = await api.get<any>(`/shipping/${shipping.id}/tracking`);
          setTrackingData(tracking);
        } catch { setTrackingData(null); }
      } else {
        setTrackingData(null);
      }
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => {
    if (selectedOrderId) fetchDetail(selectedOrderId);
    else { setSelectedOrder(null); setTrackingData(null); }
  }, [selectedOrderId, shippingOrders]);

  // ── Handlers ──────────────────────────────────────
  const handleAssignDriver = async () => {
    if (!selectedOrderId || !driverName || !deadline) { alert(t('shipping.fill_all_info')); return; }
    setAssignLoading(true);
    try {
      await api.post(`/orders/${selectedOrderId}/assign-driver`, {
        driverId: driverId || undefined, driverName,
        vehicle: vehicle || undefined, deadline,
      });
      setDriverId(null); setDriverName(''); setVehicle(''); setDeadline('');
      await fetchAll();
    } catch (err: any) { alert(err.message); }
    finally { setAssignLoading(false); }
  };

  const handleCompleteDelivery = async () => {
    if (!selectedOrderId || !confirm(t('shipping.confirm_delivery'))) return;
    try { await api.post(`/orders/${selectedOrderId}/complete-delivery`, {}); await fetchAll(); }
    catch (err: any) { alert(err.message); }
  };

  const handleFailDelivery = async () => {
    if (!selectedOrderId) return;
    const reason = prompt(t('shipping.fail_reason'));
    if (!reason) return;
    try { await api.post(`/orders/${selectedOrderId}/fail-delivery`, { reason }); await fetchAll(); setSelectedOrderId(null); }
    catch (err: any) { alert(err.message); }
  };

  const handleUpdateStatus = async (newStatus: string, confirmMsg: string) => {
    if (!selectedOrderId || !confirm(confirmMsg)) return;
    try { await api.put(`/orders/${selectedOrderId}/status`, { status: newStatus }); await fetchAll(); }
    catch (err: any) { alert(err.message); }
  };

  const handleDownloadProofs = async () => {
    if (!selectedOrderId || !selectedOrder) return;
    setDownloadingProofs(true);
    try {
      const proofs = await api.get<any[]>(`/orders/${selectedOrderId}/delivery-proofs`);
      if (!proofs || proofs.length === 0) { alert('Chưa có chứng từ để tải'); return; }
      for (const proof of proofs) {
        const link = document.createElement('a');
        link.href = proof.fileUrl;
        link.download = `${selectedOrder.code}_${proof.fileName || `chungtu_${proof.id}`}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (proofs.length > 1) await new Promise(r => setTimeout(r, 300));
      }
    } catch (err: any) { alert(err.message || 'Lỗi tải chứng từ'); }
    finally { setDownloadingProofs(false); }
  };

  const openInvoice = (order: any) => {
    setInvoiceOrderId(order.id);
    setInvoiceOrderCode(order.code);
    setInvoiceOpen(true);
  };

  const openPickingSlip = (order: any) => {
    const ship = shippingOrders.find(s => s.orderId === order.id);
    if (ship) {
      setPickingSlipShippingId(ship.id);
      setPickingSlipShippingCode(ship.code);
    } else {
      setPickingSlipShippingId(order.id);
      setPickingSlipShippingCode(order.code);
    }
    setPickingSlipOpen(true);
  };

  return {
    // Data
    loading, orders, drivers, filteredOrders, kpis,
    shippingOrders, selectedOrder, trackingData, detailLoading,
    // UI state
    searchTerm, setSearchTerm, viewFilter, setViewFilter,
    selectedOrderId, setSelectedOrderId,
    // Driver form
    driverName, setDriverName, vehicle, setVehicle,
    deadline, setDeadline, assignLoading,
    setDriverId,
    // Invoice
    invoiceOpen, setInvoiceOpen, invoiceOrderId, invoiceOrderCode, openInvoice,
    // Picking slip
    pickingSlipOpen, setPickingSlipOpen,
    pickingSlipShippingId, pickingSlipShippingCode, openPickingSlip,
    // Proofs
    hasProofs, setHasProofs, downloadingProofs,
    // Handlers
    handleAssignDriver, handleCompleteDelivery,
    handleFailDelivery, handleUpdateStatus, handleDownloadProofs,
  };
}
