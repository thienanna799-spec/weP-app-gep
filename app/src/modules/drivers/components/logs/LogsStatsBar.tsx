import React from 'react';
import { Clock, Fuel, MapPin } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import { formatCurrency } from '../../../../utils/format';

interface LogsStatsBarProps {
  totalSessions: number;
  totalKm: number;
  totalFuelEntries: number;
  totalFuelCost: number;
}

export const LogsStatsBar: React.FC<LogsStatsBarProps> = ({
  totalSessions,
  totalKm,
  totalFuelEntries,
  totalFuelCost,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <Card className="p-4 border-none shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ca làm việc</p>
          <p className="text-xl font-black text-slate-900">{totalSessions}</p>
        </div>
      </div>
    </Card>
    <Card className="p-4 border-none shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng KM</p>
          <p className="text-xl font-black text-slate-900">{totalKm.toLocaleString('vi-VN')}</p>
        </div>
      </div>
    </Card>
    <Card className="p-4 border-none shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Fuel className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đổ xăng</p>
          <p className="text-xl font-black text-amber-600">{totalFuelEntries} lượt</p>
        </div>
      </div>
    </Card>
    <Card className="p-4 border-none shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
          <Fuel className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng chi phí</p>
          <p className="text-xl font-black text-rose-600">{formatCurrency(totalFuelCost)}</p>
        </div>
      </div>
    </Card>
  </div>
);
