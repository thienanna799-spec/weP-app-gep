import React from 'react';
import { Factory, Package, Truck, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryData {
  production: { current: number; previous: number; change: number };
  inventory: number;
  activeDeliveries: number;
  alertCount: number;
}

interface Props {
  data: SummaryData | null;
  loading: boolean;
}

const SummaryCards: React.FC<Props> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Sản lượng kỳ này',
      value: data.production.current,
      change: data.production.change,
      icon: Factory,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Tồn kho hiện tại',
      value: data.inventory,
      icon: Package,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Đang giao hàng',
      value: data.activeDeliveries,
      icon: Truck,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Cảnh báo',
      value: data.alertCount,
      icon: AlertTriangle,
      color: 'red',
      gradient: 'from-red-500 to-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label}
            className="relative overflow-hidden bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm hover:shadow-md transition-shadow group">
            {/* Background gradient accent */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-[40px] group-hover:opacity-10 transition-opacity`} />

            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`p-1.5 bg-gradient-to-br ${card.gradient} rounded-lg shadow-sm`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 leading-none">{card.value.toLocaleString()}</span>
              {'change' in card && card.change !== undefined && (
                <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  card.change > 0 ? 'bg-green-50 text-green-600' : card.change < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : card.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {card.change > 0 ? '+' : ''}{card.change}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
