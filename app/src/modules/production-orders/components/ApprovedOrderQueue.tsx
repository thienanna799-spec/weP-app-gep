/**
 * ApprovedOrderQueue — Sidebar listing approved orders waiting for LSX
 */

import React from 'react';
import { ArrowRight, ArrowUp, ArrowDown, ShoppingCart } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatDate } from '../../../utils/format';
import { PRIORITY_LABELS } from '../types';

interface Props {
  sortedOrders: any[];
  queueOrder: Record<string, number>;
  onSelectOrder: (order: any) => void;
  onMoveUp: (orderId: string, e: React.MouseEvent) => void;
  onMoveDown: (orderId: string, e: React.MouseEvent) => void;
  onSetPosition: (orderId: string, position: number) => void;
}

const ApprovedOrderQueue: React.FC<Props> = ({
  sortedOrders, queueOrder, onSelectOrder,
  onMoveUp, onMoveDown, onSetPosition,
}) => (
  <div className="lg:col-span-4 space-y-3">
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Đơn hàng chờ LSX</h4>
    {sortedOrders.length === 0 ? (
      <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-3">
        <div className="p-3 bg-white rounded-full shadow-sm">
          <ShoppingCart className="w-6 h-6 text-gray-200" />
        </div>
        <p className="text-sm text-gray-400 italic">Hết đơn hàng chờ duyệt</p>
      </div>
    ) : (
      sortedOrders.map((order, index) => {
        const pri = PRIORITY_LABELS[order.priority] || PRIORITY_LABELS.trung_binh;
        const queuePos = queueOrder[order.id];
        return (
          <Card key={order.id} className="p-0 overflow-hidden hover:border-blue-500 transition-all group shadow-sm">
            {/* Priority header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {queuePos ?? index + 1}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pri.color} ${pri.textColor} ${pri.borderColor}`}>
                  {pri.label}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={(e) => onMoveUp(order.id, e)} disabled={index === 0}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                  title="Tăng ưu tiên">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => onMoveDown(order.id, e)} disabled={index === sortedOrders.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                  title="Giảm ưu tiên">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <input type="number" min="1" max="99" value={queuePos ?? ''} placeholder="#"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); onSetPosition(order.id, Number(e.target.value)); }}
                  className="w-9 h-6 text-center text-[11px] font-bold border border-gray-200 rounded bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  title="Nhập số thứ tự ưu tiên" />
              </div>
            </div>
            {/* Order content */}
            <div className="p-4 cursor-pointer" onClick={() => onSelectOrder(order)}>
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="font-bold text-gray-900 leading-tight">{order.customerName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-bold text-slate-700">{order.quantity} cuộn</span>
                    <span>•</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Card>
        );
      })
    )}
  </div>
);

export default ApprovedOrderQueue;
