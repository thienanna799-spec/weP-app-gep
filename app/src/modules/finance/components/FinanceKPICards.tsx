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
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="p-5 bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none shadow-xl shadow-blue-200">
      <p className="text-blue-200 text-[10px] font-bold uppercase tracking-wider mb-1">Lợi nhuận thực nhận</p>
      <h3 className="text-2xl font-black">{formatCurrency(stats.profit)}</h3>
      <div className="mt-3 pt-3 border-t border-blue-500/30 flex justify-between text-[10px]">
        <span className="opacity-80">Doanh thu dự kiến</span>
        <span className="font-bold">+{formatCurrency(stats.pendingRevenue)}</span>
      </div>
    </Card>
    <Card className="p-5 border-l-4 border-green-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><ArrowUpCircle className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Đã thanh toán</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.paidRevenue)}</p>
          <p className="text-[10px] text-gray-400">{stats.paidCount} đơn</p>
        </div>
      </div>
    </Card>
    <Card className="p-5 border-l-4 border-amber-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><ShoppingCart className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Chưa thanh toán</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.unpaidRevenue)}</p>
          <p className="text-[10px] text-gray-400">{stats.unpaidCount} đơn</p>
        </div>
      </div>
    </Card>
    <Card className="p-5 border-l-4 border-red-500">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><ArrowDownCircle className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng chi phí</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
          <p className="text-[10px] text-gray-400">NL: {formatCurrency(stats.materialExpense)} | Xăng: {formatCurrency(stats.fuelExpense)}</p>
        </div>
      </div>
    </Card>
  </div>
);

export default FinanceKPICards;
