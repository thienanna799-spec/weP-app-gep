/**
 * FinanceKPICards — 4 main KPI summary cards
 */

import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, ShoppingCart } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';
import type { FinanceStats } from '../types';

interface Props {
  stats: FinanceStats;
}

const FinanceKPICards: React.FC<Props> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
    <Card className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white border-none flex flex-col justify-center shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[9px] font-bold uppercase text-blue-200 mb-0.5">Lợi nhuận thực</p>
          <h3 className="text-lg font-black leading-none">{formatCurrency(stats.profit)}</h3>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[8px] text-blue-300 uppercase font-bold">Dự kiến</span>
          <span className="text-[10px] font-bold text-blue-50">+{formatCurrency(stats.pendingRevenue)}</span>
        </div>
      </div>
    </Card>

    <Card className="py-1.5 px-3 border-l-4 border-green-500 flex items-center justify-between">
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Đã thanh toán</p>
        <p className="text-base font-bold text-green-600 leading-none">{formatCurrency(stats.paidRevenue)}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <ArrowUpCircle className="w-3.5 h-3.5 text-green-500 mb-0.5" />
        <span className="text-[9px] font-bold text-gray-400">{stats.paidCount} đơn</span>
      </div>
    </Card>

    <Card className="py-1.5 px-3 border-l-4 border-amber-500 flex items-center justify-between">
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Chưa thanh toán</p>
        <p className="text-base font-bold text-amber-600 leading-none">{formatCurrency(stats.unpaidRevenue)}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <ShoppingCart className="w-3.5 h-3.5 text-amber-500 mb-0.5" />
        <span className="text-[9px] font-bold text-gray-400">{stats.unpaidCount} đơn</span>
      </div>
    </Card>

    <Card className="py-1.5 px-3 border-l-4 border-red-500 flex items-center justify-between">
      <div>
        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tổng chi phí</p>
        <p className="text-base font-bold text-red-600 leading-none">{formatCurrency(stats.totalExpense)}</p>
      </div>
      <div className="text-right flex flex-col items-end">
        <ArrowDownCircle className="w-3.5 h-3.5 text-red-500 mb-0.5" />
        <span className="text-[8px] font-medium text-gray-400">NL:{stats.materialExpense}</span>
      </div>
    </Card>
  </div>
);

export default FinanceKPICards;
