import React from 'react';
import { Users, Truck, AlertTriangle, CheckCircle, Fuel, PenTool } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';

interface DriverStatsProps {
  stats: {
    totalDrivers: number;
    deliveringDrivers: number;
    availableDrivers: number;
    activeVehicles: number;
    maintenanceVehicles: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
  };
}

export const DriverStatsCards: React.FC<DriverStatsProps> = ({ stats }) => {
  const cards = [
    { label: 'Tổng tài xế', value: stats.totalDrivers, sub: `${stats.deliveringDrivers} đang giao`, icon: Users, color: 'indigo' },
    { label: 'Phương tiện', value: stats.activeVehicles, sub: `${stats.maintenanceVehicles} cần bảo trì`, icon: Truck, color: 'blue' },
    { label: 'Giao hàng', value: stats.successfulDeliveries, sub: `${stats.failedDeliveries} thất bại`, icon: CheckCircle, color: 'emerald' },
    { label: 'Nhiên liệu', value: formatCurrency(stats.totalFuelCost), sub: 'Tháng này', icon: Fuel, color: 'orange' },
    { label: 'Bảo trì', value: formatCurrency(stats.totalMaintenanceCost), sub: 'Tổng đã chi', icon: PenTool, color: 'rose' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <Card key={idx} className="p-3 bg-white border-none shadow-sm relative overflow-hidden group flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform shrink-0`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{card.label}</p>
            <p className="text-lg font-black text-slate-900 leading-tight truncate">{card.value}</p>
            <p className="text-[9px] text-slate-500 truncate">{card.sub}</p>
          </div>
          <div className={`absolute bottom-0 left-0 h-1 w-full bg-${card.color}-500 opacity-20`} />
        </Card>
      ))}
    </div>
  );
};
