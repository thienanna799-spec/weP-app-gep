import React from 'react';

interface OverviewTabContentProps {
  loadingHistory: boolean;
  dailyOverview: any[];
  jumpToHistory: (date: string, type: string) => void;
}

export const OverviewTabContent: React.FC<OverviewTabContentProps> = ({
  loadingHistory, dailyOverview, jumpToHistory
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
          Tổng kết Biến động theo Ngày (Cuộn)
        </h3>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3 text-left">Ngày</th>
                <th className="px-4 py-3 border-l border-slate-200 text-blue-600">Sản xuất nội</th>
                <th className="px-4 py-3 border-l border-slate-200 text-cyan-600">Nhập ngoài</th>
                <th className="px-4 py-3 border-l border-slate-200 text-orange-600">Xuất kho</th>
                <th className="px-4 py-3 border-l border-slate-200 text-purple-600">Hoàn trả</th>
                <th className="px-4 py-3 border-l border-slate-200 text-amber-600">Lỗi</th>
                <th className="px-4 py-3 border-l border-slate-200 text-red-600">Hỏng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingHistory ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Đang tính toán...</td></tr>
              ) : dailyOverview.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">Không có dữ liệu biến động</td></tr>
              ) : (
                dailyOverview.map((day: any) => (
                  <tr key={day.date} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700 text-left">
                      {new Date(day.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-blue-700 text-base">
                      {day.sanXuatNoi > 0 ? <button onClick={() => jumpToHistory(day.date, 'sanXuatNoi')} className="hover:underline">{day.sanXuatNoi}</button> : '—'}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-cyan-700 text-base">
                      {day.nhapNgoai > 0 ? <button onClick={() => jumpToHistory(day.date, 'nhapNgoai')} className="hover:underline">{day.nhapNgoai}</button> : '—'}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-orange-700 text-base">
                      {day.xuatKho > 0 ? <button onClick={() => jumpToHistory(day.date, 'xuatKho')} className="hover:underline">{day.xuatKho}</button> : '—'}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-purple-700 text-base">
                      {day.hoanTra > 0 ? <button onClick={() => jumpToHistory(day.date, 'hoanTra')} className="hover:underline">{day.hoanTra}</button> : '—'}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-amber-700 text-base">
                      {day.loi > 0 ? <button onClick={() => jumpToHistory(day.date, 'loi')} className="hover:underline">{day.loi}</button> : '—'}
                    </td>
                    <td className="px-4 py-3 border-l border-slate-100 font-black text-red-700 text-base">
                      {day.hong > 0 ? <button onClick={() => jumpToHistory(day.date, 'hong')} className="hover:underline">{day.hong}</button> : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
