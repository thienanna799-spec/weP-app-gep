import React from 'react';
import { Clock, User } from 'lucide-react';
import { OrderLog } from '../../../types/order.types';
import { formatDateTime } from '../../../utils/format';

interface OrderLogsTimelineProps {
  logs: OrderLog[];
}

export default function OrderLogsTimeline({ logs }: OrderLogsTimelineProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">Tiến độ & Lịch sử</h3>
      <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {logs.map((log, idx) => (
          <div key={log.id} className="relative pl-10">
            <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm z-10 ${idx === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {idx === 0 ? <Clock className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{log.action}</p>
              <div className="flex items-center gap-2 mt-0.5 opacity-60">
                <User className="w-3 h-3" />
                <span className="text-[10px] font-medium">{log.createdBy}</span>
                <span className="text-[10px]">•</span>
                <span className="text-[10px]">{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
