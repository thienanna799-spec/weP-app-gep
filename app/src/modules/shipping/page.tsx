/**
 * Dispatch Center — Xuất kho & Giao hàng & Hoàn trả
 * ───────────────────────────────────────────────────
 * Tab layout: Xuất kho | Hoàn trả
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Input from '../../components/ui/Input';
import { UserProfile } from '../../types/user.types';
import { useDispatchPage } from './hooks/useDispatchPage';
import { Truck, RotateCcw, Search } from 'lucide-react';

import DispatchOrderList from './components/DispatchOrderList';
import DispatchDetailView from './components/DispatchDetailView';
import ShippingInvoice from './components/ShippingInvoice';
import PickingSlipPreview from './components/PickingSlipPreview';
import ReturnsTab from './components/ReturnsTab';

interface DispatchPageProps { profile: UserProfile; }

type TabKey = 'dispatch' | 'returns';

export default function DispatchPage({ profile }: DispatchPageProps) {
  const [tab, setTab] = useState<TabKey>('dispatch');
  const d = useDispatchPage();

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dispatch', label: 'Xuất kho & Giao hàng', icon: <Truck size={15} /> },
    { key: 'returns', label: 'Hoàn trả', icon: <RotateCcw size={15} /> },
  ];

  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setHeaderPortal(document.getElementById('page-header-portal'));
  }, []);

  const topControlBar = (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit shrink-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar (only for dispatch tab) */}
      {tab === 'dispatch' && (
        <div className="relative flex-1 max-w-2xl w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm mã đơn, khách hàng..." className="pl-10 h-10 w-full shadow-sm" value={d.searchTerm} onChange={(e: any) => d.setSearchTerm(e.target.value)} />
        </div>
      )}
    </div>
  );

  return (
    <div>
      {headerPortal ? ReactDOM.createPortal(topControlBar, headerPortal) : topControlBar}

      {/* Dispatch Tab */}
      {tab === 'dispatch' && (
        <>
          {d.loading ? <LoadingSpinner /> : (
            <div className="flex h-[calc(100vh-150px)] gap-6">
              <DispatchOrderList
                orders={d.orders}
                filteredOrders={d.filteredOrders}
                kpis={d.kpis}
                searchTerm={d.searchTerm}
                setSearchTerm={d.setSearchTerm}
                viewFilter={d.viewFilter}
                setViewFilter={d.setViewFilter}
                selectedOrderId={d.selectedOrderId}
                setSelectedOrderId={d.setSelectedOrderId}
              />

              {d.selectedOrderId && (
                <DispatchDetailView
                  selectedOrder={d.selectedOrder}
                  trackingData={d.trackingData}
                  detailLoading={d.detailLoading}
                  drivers={d.drivers}
                  hasProofs={d.hasProofs}
                  downloadingProofs={d.downloadingProofs}
                  driverName={d.driverName} setDriverName={d.setDriverName}
                  vehicle={d.vehicle} setVehicle={d.setVehicle}
                  deadline={d.deadline} setDeadline={d.setDeadline}
                  assignLoading={d.assignLoading}
                  setDriverId={d.setDriverId}
                  onClose={() => d.setSelectedOrderId(null)}
                  onOpenInvoice={d.openInvoice}
                  onOpenPickingSlip={d.openPickingSlip}
                  onAssignDriver={d.handleAssignDriver}
                  onCompleteDelivery={d.handleCompleteDelivery}
                  onFailDelivery={d.handleFailDelivery}
                  onUpdateStatus={d.handleUpdateStatus}
                  onDownloadProofs={d.handleDownloadProofs}
                  onProofsChange={d.setHasProofs}
                />
              )}

              <ShippingInvoice isOpen={d.invoiceOpen} onClose={() => d.setInvoiceOpen(false)} orderId={d.invoiceOrderId} orderCode={d.invoiceOrderCode} />
              <PickingSlipPreview isOpen={d.pickingSlipOpen} onClose={() => d.setPickingSlipOpen(false)} shippingId={d.pickingSlipShippingId} shippingCode={d.pickingSlipShippingCode} />
            </div>
          )}
        </>
      )}

      {/* Returns Tab */}
      {tab === 'returns' && <ReturnsTab />}
    </div>
  );
}
