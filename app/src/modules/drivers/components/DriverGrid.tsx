import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { DRIVER_STATUS_LABELS } from '../constants';

interface DriverGridProps {
  driverLocations: any[];
  driversWithoutGPS: any[];
  focusedDriver: string | null;
  driverColorMap: Record<string, string>;
  onFocusDriver: (driverId: string | null) => void;
}

const STATUS_ICONS: Record<string, string> = {
  available: '🟢',
  delivering: '🚚',
  leave: '😴',
  inactive: '⚫',
  blocked: '🔒',
};

export default function DriverGrid({
  driverLocations,
  driversWithoutGPS,
  focusedDriver,
  driverColorMap,
  onFocusDriver
}: DriverGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {driverLocations.map(({ driver, gps }) => {
        const color = driverColorMap[driver.id] || '#64748b';
        return (
          <Card
            key={driver.id}
            onClick={() => onFocusDriver(focusedDriver === driver.id ? null : driver.id)}
            className={`p-3 border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
              focusedDriver === driver.id ? 'bg-slate-50' : ''
            }`}
            style={{ borderColor: focusedDriver === driver.id ? color : 'transparent' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm"
                style={{ backgroundColor: color }}
              >
                {driver.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{driver.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{driver.code}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-600">
                  {STATUS_ICONS[driver.status]} {DRIVER_STATUS_LABELS[driver.status]}
                </p>
                {gps && (
                  <p className="text-[8px] text-slate-400 flex items-center gap-0.5 justify-end">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(gps.timestamp).toLocaleTimeString('vi-VN')}
                  </p>
                )}
              </div>
            </div>
            {gps && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
                <p className="text-[9px] text-slate-400 font-mono">
                  {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                </p>
              </div>
            )}
          </Card>
        );
      })}

      {driversWithoutGPS.map(driver => (
        <Card key={driver.id} className="p-3 border-2 border-transparent shadow-sm opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-black">
              {driver.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-500 truncate">{driver.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">{driver.code}</p>
            </div>
            <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Không GPS
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
