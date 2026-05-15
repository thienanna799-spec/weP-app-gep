import React from 'react';
import { AlertTriangle, AlertCircle, Clock, Package, Truck, TrendingDown } from 'lucide-react';

interface Alert {
  type: string;
  message: string;
  severity: 'warning' | 'danger' | 'info';
}

interface Props {
  alerts: Alert[];
}

const ICONS: Record<string, any> = { material: Package, deadline: Clock, delivery: Truck, slowstock: TrendingDown };
const COLORS: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', text: 'text-amber-800' },
  danger: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', text: 'text-red-800' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', text: 'text-blue-800' },
};

const SmartAlerts: React.FC<Props> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-xl"><AlertCircle className="w-5 h-5 text-green-600" /></div>
        <div>
          <p className="text-sm font-bold text-green-800">Không có cảnh báo</p>
          <p className="text-xs text-green-600">Tất cả chỉ số hoạt động đều trong ngưỡng an toàn.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" /> Cảnh báo thông minh ({alerts.length})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.map((alert, i) => {
          const colors = COLORS[alert.severity] || COLORS.warning;
          const Icon = ICONS[alert.type] || AlertTriangle;
          return (
            <div key={i} className={`${colors.bg} ${colors.border} border rounded-xl p-4 flex items-start gap-3`}>
              <div className={`p-2 rounded-lg ${colors.bg}`}><Icon className={`w-4 h-4 ${colors.icon}`} /></div>
              <p className={`text-sm font-medium ${colors.text} flex-1`}>{alert.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartAlerts;
