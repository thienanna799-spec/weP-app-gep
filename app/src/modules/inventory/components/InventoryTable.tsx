import React from 'react';
import { PricingCell } from './PricingCell';

interface InventoryTableProps {
  filteredData: any[];
  dataLength: number;
  selectedSkus: Set<string>;
  selectedRow: any;
  setSelectedRow: (row: any | null) => void;
  toggleAllSkus: () => void;
  toggleSku: (e: React.MouseEvent, key: string) => void;
  totals: any;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  filteredData,
  dataLength,
  selectedSkus,
  selectedRow,
  setSelectedRow,
  toggleAllSkus,
  toggleSku,
  totals
}) => {
  if (filteredData.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-slate-400 text-sm italic">
        {dataLength === 0 ? 'Chưa có dữ liệu tồn kho. Hãy nhập hàng trước hoặc import Excel.' : 'Không tìm thấy kết quả'}
      </div>
    );
  }

  return (
    <table className="w-full text-left text-xs min-h-full border-separate border-spacing-0">
      <thead className="bg-slate-50 sticky top-0 z-40">
        <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          <th style={{ position: 'sticky', left: 0, top: 0, minWidth: '40px', maxWidth: '40px', width: '40px' }} className="sticky px-2 py-2.5 whitespace-nowrap bg-slate-50 z-30 text-center border-b border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
            <input type="checkbox" checked={selectedSkus.size === filteredData.length && filteredData.length > 0} onChange={toggleAllSkus} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" />
          </th>
          <th style={{ position: 'sticky', left: '40px', top: 0 }} className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 z-30 border-b border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">Sub-SKU</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Xưởng (NCC)</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Tên SP</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Quy cách</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Màu sắc</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Kích thước</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">Đơn vị bán</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20">K.Thước Đ.Vị</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right">Giá bán</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-slate-500">Giá nhập (Gần nhất)</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-slate-500">Giá nhập (TB)</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-blue-600">Nhập</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-orange-600">Xuất</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-indigo-600">Hệ thống</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-emerald-600">Thực tế</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-green-600">Khả dụng</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-purple-600">Đã giữ</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-amber-600">Lỗi</th>
          <th className="sticky px-3 py-2.5 whitespace-nowrap bg-slate-50 border-b border-slate-200 top-0 z-20 text-right text-red-600">Hỏng</th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map((row: any, idx: number) => {
          const isSelected = selectedRow?.subSku === row.subSku && selectedRow?.supplier === row.supplier && selectedRow?.productName === row.productName;
          const rowKey = `${row.subSku}|${row.supplier}`;
          const isChecked = selectedSkus.has(rowKey);
          return (
            <tr key={idx} onClick={() => setSelectedRow(isSelected ? null : row)}
              style={{ height: '1px' }}
              className={`cursor-pointer transition-all hover:bg-indigo-50/50 ${isSelected ? 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-300' : ''} ${isChecked ? 'bg-emerald-50/30' : ''}`}>
              <td style={{ position: 'sticky', left: 0, minWidth: '40px', maxWidth: '40px', width: '40px' }} className="sticky px-2 py-2.5 text-center bg-white z-20 border-b border-r border-slate-100 shadow-[1px_0_0_0_#f1f5f9]" onClick={(e) => toggleSku(e, rowKey)}>
                <input type="checkbox" checked={isChecked} onChange={() => {}} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer" />
              </td>
              <td style={{ position: 'sticky', left: '40px' }} className="sticky px-3 py-2.5 font-mono text-[11px] font-bold text-slate-700 bg-white z-20 border-b border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                <div className="flex items-center gap-1.5">
                  {row.subSku || '—'}
                  {row.minStock > 0 && row.tonKhaDung <= row.minStock && (
                    <span className="flex-shrink-0 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-sm">!</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-slate-600 font-medium border-b border-slate-100">{row.supplier || '—'}</td>
              <td className="px-3 py-2.5 text-slate-900 font-bold max-w-[200px] truncate border-b border-slate-100" title={row.productName}>{row.productName}</td>
              <td className="px-3 py-3 border-b border-slate-100 max-w-[120px] truncate" title={row.specification}>{row.specification}</td>
              <td className="px-3 py-3 border-b border-slate-100">{row.color || '-'}</td>
              <td className="px-3 py-3 border-b border-slate-100">{row.size || '-'}</td>
              <td className="px-3 py-3 border-b border-slate-100">{row.salesUnit || '-'}</td>
              <td className="px-3 py-3 border-b border-slate-100">{row.unitSize || '-'}</td>
              <td className="px-3 py-3 border-b border-slate-100 text-right font-medium">
                <PricingCell sku={row.sku} count={row.pricingCount || 0} />
              </td>
              <td className="px-3 py-3 border-b border-slate-100 text-right font-mono text-slate-500 font-medium">
                {row.costPriceLatest ? `${row.costPriceLatest.toLocaleString('vi-VN')} đ` : '—'}
              </td>
              <td className="px-3 py-3 border-b border-slate-100 text-right font-mono text-slate-500 font-medium">
                {row.costPriceAverage ? `${row.costPriceAverage.toLocaleString('vi-VN')} đ` : '—'}
              </td>
              <td className="px-3 py-3 border-b border-slate-100 text-right font-black text-blue-600 bg-blue-50/20">{row.nhapKho}</td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-bold text-orange-700">{row.xuatKho}</td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-black text-indigo-900">{row.tonKho}</td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-black text-emerald-900 bg-emerald-50/50">{row.tonThucTe}</td>
              <td className={`px-3 py-2.5 border-b border-slate-100 text-right font-mono font-black transition-all duration-300 ${
                row.minStock > 0 && row.tonKhaDung <= row.minStock 
                  ? 'text-rose-700 bg-rose-50 ring-1 ring-inset ring-rose-200' 
                  : 'text-green-900 bg-green-50/50'
              }`}>
                {row.tonKhaDung}
              </td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-bold text-purple-700">{row.daGiuDon}</td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-bold text-amber-700">{row.loi || 0}</td>
              <td className="px-3 py-2.5 border-b border-slate-100 text-right font-mono font-bold text-red-700">{row.hong || 0}</td>
            </tr>
          );
        })}
        <tr className="pointer-events-none">
          <td colSpan={20} className="p-0 border-0"></td>
        </tr>
      </tbody>
      <tfoot className="bg-slate-50 sticky bottom-0 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-slate-200">
        <tr>
          <td style={{ position: 'sticky', left: 0 }} className="sticky bg-slate-50 border-b border-t-2 border-slate-300 z-30 min-w-[40px] max-w-[40px] w-[40px]"></td>
          <td style={{ position: 'sticky', left: '40px' }} className="sticky px-3 py-3 bg-slate-50 border-b border-t-2 border-slate-300 z-30 font-mono text-[11px] font-bold text-slate-700"></td>
          <td colSpan={4} className="px-3 py-3 border-t-2 border-slate-300 text-right text-slate-800 tracking-wide font-black uppercase text-xs">Tổng ({dataLength} Mã)</td>
          <td className="px-3 py-2 text-left border-r border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Số Sub-SKU</p>
            <p className="font-black text-slate-700 text-[13px] mt-0.5">{new Set(filteredData.map((r:any) => r.subSku).filter(Boolean)).size}</p>
          </td>
          <td className="px-3 py-2 text-left border-r border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Số Xưởng</p>
            <p className="font-black text-slate-700 text-[13px] mt-0.5">{new Set(filteredData.map((r:any) => r.supplier).filter(Boolean)).size}</p>
          </td>
          <td className="px-3 py-2 text-left border-r border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Số SP</p>
            <p className="font-black text-slate-700 text-[13px] mt-0.5">{new Set(filteredData.map((r:any) => r.productName).filter(Boolean)).size}</p>
          </td>
          <td className="px-3 py-2 text-left">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Số Quy cách</p>
            <p className="font-black text-slate-700 text-[13px] mt-0.5">{new Set(filteredData.map((r:any) => r.specification).filter(Boolean)).size}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            {/* Empty space for Giá nhập (Gần nhất) */}
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            {/* Empty space for Giá nhập (TB) */}
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Tổng nhập</p>
            <p className="font-black text-blue-600 text-[15px] mt-0.5">{totals.nhapKho}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Tổng xuất</p>
            <p className="font-black text-orange-600 text-[15px] mt-0.5">{totals.xuatKho}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Tồn HT</p>
            <p className="font-black text-indigo-700 text-[15px] mt-0.5">{totals.tonKho}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Thực tế</p>
            <p className="font-black text-emerald-700 text-[15px] mt-0.5">{totals.tonThucTe}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Khả dụng</p>
            <p className="font-black text-green-700 text-[15px] mt-0.5">{totals.tonKhaDung}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Đã giữ (ĐH)</p>
            <p className="font-black text-purple-600 text-[15px] mt-0.5">{totals.daGiuDon}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Lỗi</p>
            <p className="font-black text-amber-600 text-[15px] mt-0.5">{totals.loi}</p>
          </td>
          <td className="px-3 py-2 text-right border-l border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase">Hỏng</p>
            <p className="font-black text-red-600 text-[15px] mt-0.5">{totals.hong}</p>
          </td>
        </tr>
      </tfoot>
    </table>
  );
};
