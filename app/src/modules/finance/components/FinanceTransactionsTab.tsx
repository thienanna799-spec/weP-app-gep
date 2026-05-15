/**
 * FinanceTransactionsTab — Full transaction history
 * ──────────────────────────────────────────────────
 * Scrollable list of all income/expense transactions.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { formatCurrency } from '../../../utils/format';
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const FinanceTransactionsTab: React.FC<Props> = ({ transactions }) => (
  <Card className="p-6">
    <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Lịch sử giao dịch ({transactions.length})</h3>
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{tx.desc}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(tx.date).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
            <Badge variant={tx.type === 'income' ? 'green' : 'red'}>
              {tx.type === 'income' ? 'Thu' : 'Chi'}
            </Badge>
          </div>
        </div>
      ))}
      {transactions.length === 0 && (
        <p className="text-center text-gray-400 italic py-8">Chưa có giao dịch</p>
      )}
    </div>
  </Card>
);

export default FinanceTransactionsTab;
