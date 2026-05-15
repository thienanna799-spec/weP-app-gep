/**
 * FinanceOverviewTab — Financial summary + recent transactions
 */

import React from 'react';
import { TrendingUp, ShoppingCart, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../utils/format';
import { fmtShortDate } from '../constants';
import type { FinanceStats, Transaction } from '../types';

interface Props {
  stats: FinanceStats;
  allTransactions: Transaction[];
}

const FinanceOverviewTab: React.FC<Props> = ({ stats, allTransactions }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Financial Summary */}
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-500" /> Tóm tắt tài chính
      </h3>
      <div className="space-y-3">
        {[
          { label: 'Tổng doanh thu', value: stats.totalRevenue, color: 'text-green-600', bg: 'bg-green-50', icon: '💰' },
          { label: 'Đã thanh toán', value: stats.paidRevenue, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
          { label: 'Chưa thanh toán (Công nợ)', value: stats.unpaidRevenue, color: 'text-amber-600', bg: 'bg-amber-50', icon: '⏳' },
          { label: 'Chi phí nguyên liệu', value: stats.materialExpense, color: 'text-red-600', bg: 'bg-red-50', icon: '📦' },
          { label: 'Chi phí xăng dầu', value: stats.fuelExpense, color: 'text-orange-600', bg: 'bg-orange-50', icon: '⛽' },
          { label: 'Lợi nhuận gộp', value: stats.balance, color: stats.balance >= 0 ? 'text-emerald-600' : 'text-red-600', bg: stats.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50', icon: '📊' },
          { label: 'Lợi nhuận thực (Đã TT - Chi phí)', value: stats.profit, color: stats.profit >= 0 ? 'text-blue-600' : 'text-red-600', bg: stats.profit >= 0 ? 'bg-blue-50' : 'bg-red-50', icon: '📈' },
        ].map((item, i) => (
          <div key={i} className={`flex justify-between items-center p-3 ${item.bg} rounded-xl`}>
            <span className="text-sm text-gray-700 flex items-center gap-2"><span>{item.icon}</span>{item.label}</span>
            <span className={`font-bold ${item.color}`}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>

    {/* Order Stats */}
    <Card className="p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShoppingCart className="w-5 h-5 text-indigo-500" /> Thống kê đơn hàng
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Tổng đơn', value: stats.totalOrders, icon: '📋', bg: 'bg-slate-50' },
          { label: 'Hoàn thành', value: stats.completedOrders, icon: '✅', bg: 'bg-green-50' },
          { label: 'Đã thanh toán', value: stats.paidCount, icon: '💵', bg: 'bg-emerald-50' },
          { label: 'Chưa TT', value: stats.unpaidCount, icon: '⏳', bg: 'bg-amber-50' },
          { label: 'Đang xử lý', value: stats.pendingOrders, icon: '🔄', bg: 'bg-blue-50' },
        ].map((item, i) => (
          <div key={i} className={`p-4 ${item.bg} rounded-xl text-center`}>
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-2xl font-black text-gray-900">{item.value}</p>
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>

    {/* Recent Transactions */}
    <Card className="p-6 lg:col-span-2">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-slate-500" /> Giao dịch trong kỳ ({allTransactions.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {allTransactions.length === 0
          ? <p className="text-sm text-gray-400 italic text-center py-8">Chưa có giao dịch nào trong khoảng thời gian này</p>
          : allTransactions.slice(0, 20).map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {tx.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{tx.desc}</p>
                  <p className="text-[10px] text-gray-400">{fmtShortDate(tx.date)}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
      </div>
    </Card>
  </div>
);

export default FinanceOverviewTab;
