import React from 'react';

interface LifecycleHistoryTableProps {
  loadingHistory: boolean;
  lifecycleGroups: any[];
  expandedQrCodes: Set<string>;
  toggleExpand: (qrCode: string) => void;
  rollTimelineCache: Record<string, { loading: boolean; events: any[] }>;
}

export const LifecycleHistoryTable: React.FC<LifecycleHistoryTableProps> = ({
  loadingHistory,
  lifecycleGroups,
  expandedQrCodes,
  toggleExpand,
  rollTimelineCache
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Mã cuộn / QR</th>
              <th className="px-4 py-3">Trạng thái hiện tại</th>
              <th className="px-4 py-3">Vị trí (Kho - Khu vực - Slot)</th>
              <th className="px-4 py-3">Thông số (Dài - Nặng)</th>
              <th className="px-4 py-3">Thao tác gần nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadingHistory ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải lịch sử...</td></tr>
            ) : lifecycleGroups.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">Không có dữ liệu</td></tr>
            ) : (
              lifecycleGroups.map(group => {
                const isExpanded = expandedQrCodes.has(group.qrCode);
                const roll = group.roll;
                
                return (
                  <React.Fragment key={group.qrCode}>
                    <tr 
                      onClick={() => toggleExpand(group.qrCode)}
                      className={`cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{group.qrCode}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          group.status.includes('Trong kho') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          group.status.includes('Đã xuất') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          group.status.includes('Lỗi') ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {roll ? `${roll.positionWarehouse || '—'} / ${roll.positionArea || '—'} / ${roll.positionSlot || '—'}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium font-mono">
                        {roll ? `${roll.length || 0}m - ${roll.weight || 0}kg` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[10px]">
                        {new Date(group.lastActionTimestamp).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && (() => {
                      const cached = rollTimelineCache[group.qrCode];
                      const timelineEvents = cached?.events || group.logs;
                      const isLoading = cached?.loading;
                      
                      return (
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="pl-4 border-l-2 border-blue-200">
                            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-3">Lịch sử Vòng đời sản phẩm</h4>
                            {isLoading ? (
                              <div className="text-xs text-slate-400 py-2">Đang tải lịch sử chi tiết...</div>
                            ) : timelineEvents.length === 0 ? (
                              <div className="text-xs text-slate-400 italic py-2">Không có dữ liệu</div>
                            ) : (
                              <div className="space-y-3">
                                {timelineEvents.map((log: any, idx: number) => (
                                  <div key={log.id || idx} className="flex items-start gap-3 text-xs relative">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 border-2 ${
                                      (log.actionType || log.action || '').includes('EXPORT') || (log.action || '').includes('Xuất') ? 'bg-orange-400 border-orange-200' :
                                      (log.actionType || '').includes('CREATE') || (log.action || '').includes('Khởi tạo') ? 'bg-emerald-400 border-emerald-200' :
                                      (log.actionType || '').includes('IMPORT') || (log.action || '').includes('Nhập') ? 'bg-blue-400 border-blue-200' :
                                      (log.actionType || '').includes('DAMAGE') || (log.action || '').includes('Lỗi') ? 'bg-red-400 border-red-200' :
                                      (log.actionType || '').includes('TRANSFER') || (log.action || '').includes('Chuyển') ? 'bg-violet-400 border-violet-200' :
                                      'bg-slate-300 border-slate-200'
                                    }`} />
                                    
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                        <span className="text-slate-500 font-mono text-[10px]">
                                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          (log.action || '').includes('Xuất') ? 'bg-orange-100 text-orange-700' :
                                          (log.action || '').includes('Nhập') || (log.action || '').includes('Khởi tạo') ? 'bg-blue-100 text-blue-700' :
                                          (log.action || '').includes('Lỗi') || (log.action || '').includes('hỏng') ? 'bg-red-100 text-red-700' :
                                          (log.action || '').includes('Chuyển') ? 'bg-violet-100 text-violet-700' :
                                          'bg-slate-200 text-slate-700'
                                        }`}>
                                          {log.action}
                                        </span>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                                        {log.operator && <span className="text-slate-600">👤 {log.operator}</span>}
                                        {log.orderCode && <span className="font-mono font-bold text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded">Lệnh: {log.orderCode}</span>}
                                        {log.customerName && <span className="text-indigo-600 font-bold">🏢 {log.customerName}</span>}
                                        {log.driverName && <span className="text-emerald-600">🚚 {log.driverName}</span>}
                                        {log.fromLocation && log.toLocation && <span className="text-violet-600">📍 {log.fromLocation} → {log.toLocation}</span>}
                                        {log.note && <span className="text-slate-500 italic">📝 {log.note}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })()}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
