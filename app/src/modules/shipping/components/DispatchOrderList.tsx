/**
 * DispatchOrderList — Left panel: KPI cards + search + order list
 */

import React from 'react';
import {
  Search, Package, MapPin, Clock, PackageCheck, Truck,
  CheckCircle2, ClipboardList,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../services/orderFlowService';

type ViewFilter = 'all' | 'preparing' | 'ready' | 'delivering' | 'completed';

interface Props {
  orders: any[];
  filteredOrders: any[];
  kpis: { preparing: number; ready: number; delivering: number; completed: number };
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  viewFilter: ViewFilter;
  setViewFilter: (f: ViewFilter) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
}

const getOrderIcon = (status: string) => {
  if (['da_duyet', 'dang_chuan_bi'].includes(status)) return <ClipboardList className="w-4 h-4" />;
  if (status === 'cho_xuat_kho') return <PackageCheck className="w-4 h-4" />;
  if (status === 'dang_giao') return <Truck className="w-4 h-4" />;
  return <CheckCircle2 className="w-4 h-4" />;
};

const getIconBg = (status: string) => {
  if (['da_duyet', 'dang_chuan_bi'].includes(status)) return 'bg-blue-100 text-blue-600';
  if (status === 'cho_xuat_kho') return 'bg-purple-100 text-purple-600';
  if (status === 'dang_giao') return 'bg-orange-100 text-orange-600';
  return 'bg-green-100 text-green-600';
};

const DispatchOrderList: React.FC<Props> = ({
  orders, filteredOrders, kpis,
  searchTerm, setSearchTerm, viewFilter, setViewFilter,
  selectedOrderId, setSelectedOrderId,
}) => {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col gap-4 transition-all duration-500 ${selectedOrderId ? 'w-[30%]' : 'w-full'}`}>
      {/* KPI cards */}
      {!selectedOrderId && (
        <div className="grid grid-cols-4 gap-3 px-2">
          {([
            { label: t('shipping.preparing'), val: kpis.preparing, borderColor: 'border-blue-400', filter: 'preparing' as ViewFilter, icon: Clock },
            { label: t('shipping.ready_to_ship'), val: kpis.ready, borderColor: 'border-purple-400', filter: 'ready' as ViewFilter, icon: PackageCheck },
            { label: t('shipping.in_delivery'), val: kpis.delivering, borderColor: 'border-orange-400', filter: 'delivering' as ViewFilter, icon: Truck },
            { label: t('shipping.completed'), val: kpis.completed, borderColor: 'border-green-400', filter: 'completed' as ViewFilter, icon: CheckCircle2 },
          ]).map((k, i) => (
            <Card key={i}
              className={`p-3 border-l-4 ${k.borderColor} shadow-sm cursor-pointer hover:shadow-md transition-all ${viewFilter === k.filter ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : ''}`}
              onClick={() => setViewFilter(viewFilter === k.filter ? 'all' : k.filter)}>
              <div className="flex items-center gap-2 mb-1">
                <k.icon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
              </div>
              <p className="text-2xl font-black text-slate-900">{k.val}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Order list */}
      <Card className="flex-1 flex flex-col overflow-hidden mx-2 shadow-md border border-slate-200">
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="text-center p-8 text-slate-400 italic text-sm">
              {orders.length === 0 ? t('shipping.no_approved_orders') : t('shipping.no_matching_orders')}
            </div>
          ) : filteredOrders.map(order => (
            <div key={order.id} onClick={() => setSelectedOrderId(order.id === selectedOrderId ? null : order.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedOrderId === order.id ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500/50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${getIconBg(order.status)} flex items-center justify-center shrink-0`}>{getOrderIcon(order.status)}</div>
                  <div><p className="font-bold text-sm text-slate-900">#{order.code}</p><p className="text-[10px] text-slate-500">{order.customerName}</p></div>
                </div>
                <Badge variant={(ORDER_STATUS_COLORS[order.status] || 'gray') as any}>{ORDER_STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 bg-slate-50/50 p-2 rounded-lg">
                <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" />{order.quantity} {t('common.rolls')}</div>
                {order.customerAddress && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><span className="truncate max-w-[120px]">{order.customerAddress?.substring(0, 30)}</span></div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DispatchOrderList;
