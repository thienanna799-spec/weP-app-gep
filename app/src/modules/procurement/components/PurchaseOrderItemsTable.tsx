import React from 'react';
import { CheckCircle, Box } from 'lucide-react';
import type { PurchaseOrder } from '../services/procurement.service';

interface PurchaseOrderItemsTableProps {
  order: PurchaseOrder;
  receiveMode: boolean;
  setReceiveMode: (val: boolean) => void;
  receiveQtys: Record<string, number>;
  setReceiveQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleReceive: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const PurchaseOrderItemsTable: React.FC<PurchaseOrderItemsTableProps> = ({
  order,
  receiveMode,
  setReceiveMode,
  receiveQtys,
  setReceiveQtys,
  handleReceive
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Box size={16} className="text-gray-400" /> Danh sách vật tư
        </h3>
        {['ordered', 'partially_received'].includes(order.status) && !receiveMode && (
          <button onClick={() => setReceiveMode(true)}
            className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
            Nhận hàng
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Vật tư</th>
            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase text-right">SL đặt</th>
            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase text-right">Đã nhận</th>
            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase text-right">Đơn giá</th>
            <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase text-right">Thành tiền</th>
            {receiveMode && <th className="px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase text-right">Nhận thêm</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {order.items?.map(item => {
            const remaining = item.quantity - item.receivedQty;
            const isDone = item.receivedQty >= item.quantity;
            return (
              <tr key={item.id} className={isDone ? 'bg-green-50/30' : ''}>
                <td className="px-4 py-3 font-medium text-gray-900">{item.materialName}</td>
                <td className="px-4 py-3 text-right text-gray-700">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${isDone ? 'text-green-600' : item.receivedQty > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {item.receivedQty} / {item.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{fmt(item.unitPrice)}đ</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.quantity * item.unitPrice)}đ</td>
                {receiveMode && (
                  <td className="px-4 py-3">
                    {!isDone ? (
                      <input type="number" min={0} max={remaining}
                        value={receiveQtys[item.id!] || ''}
                        onChange={e => setReceiveQtys(prev => ({ ...prev, [item.id!]: Math.min(Number(e.target.value), remaining) }))}
                        placeholder={`Max: ${remaining}`}
                        className="w-20 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 ml-auto block"
                      />
                    ) : (
                      <span className="text-green-500 text-xs font-bold flex items-center justify-end gap-1">
                        <CheckCircle size={12} /> Đủ
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {receiveMode && (
        <div className="p-4 bg-green-50 border-t border-green-100 flex justify-end gap-3">
          <button onClick={() => { setReceiveMode(false); setReceiveQtys({}); }}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={handleReceive}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">
            Xác nhận nhận hàng
          </button>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderItemsTable;
