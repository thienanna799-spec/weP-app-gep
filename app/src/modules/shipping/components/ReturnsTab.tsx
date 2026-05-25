/**
 * ReturnsTab — Quản lý hoàn trả (nằm trong module Shipping)
 * ──────────────────────────────────────────────────────────
 * Displays return requests with filtering, stats cards, and action modals.
 * Constants/types extracted to ReturnsConstants.ts
 */

import React, { useState, useEffect } from 'react';
import {
  RotateCcw, Package, Clock, CheckCircle, XCircle,
  Plus, RefreshCw, CreditCard,
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import api from '../../../services/api';
import CreateReturnForm from './CreateReturnForm';
import ReturnDetailModal from './ReturnDetailModal';
import {
  ReturnRequest, ReturnStats,
  STATUS_LABELS, STATUS_COLORS, TYPE_LABELS, RESOLUTION_LABELS, fmt
} from './ReturnsConstants';

export default function ReturnsTab() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showResolve, setShowResolve] = useState<ReturnRequest | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rtnData, statsData] = await Promise.all([
        api.get<ReturnRequest[]>(`/returns?status=${filter}`),
        api.get<ReturnStats>('/returns/stats'),
      ]);
      setReturns(rtnData || []);
      setStats(statsData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/returns/${id}/approve`, {});
      load();
    } catch (e: any) { alert(e.message || 'Lỗi'); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;
    try {
      await api.patch(`/returns/${id}/reject`, { reason });
      load();
    } catch (e: any) { alert(e.message || 'Lỗi'); }
  };

  if (loading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Tổng RTN', value: stats.total, icon: RotateCcw, color: '#6366f1' },
            { label: 'Chờ duyệt', value: stats.pending, icon: Clock, color: '#f59e0b' },
            { label: 'Đã duyệt', value: stats.approved, icon: CheckCircle, color: '#3b82f6' },
            { label: 'Đang XL', value: stats.processing, icon: Package, color: '#8b5cf6' },
            { label: 'Đã giải quyết', value: stats.resolved, icon: CheckCircle, color: '#22c55e' },
            { label: 'Từ chối', value: stats.rejected, icon: XCircle, color: '#ef4444' },
            { label: 'Đã hoàn tiền', value: `${fmt(stats.totalRefundAmount)}đ`, icon: CreditCard, color: '#06b6d4' },
          ].map((s, i) => (
            <Card key={i} className="p-3 text-center" style={{ borderTop: `3px solid ${s.color}` }}>
              <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-[9px] font-bold text-gray-400 uppercase">{s.label}</p>
              <p className="text-lg font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'processing', 'resolved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Tất cả' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><RefreshCw size={16} /></button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2">
            <Plus size={14} /> Tạo yêu cầu hoàn trả
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-50 text-indigo-800">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">Mã RTN</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">Đơn hàng</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase">Khách hàng</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase">Loại</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase">Trạng thái</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase">Kết quả</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase">Hoàn tiền</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase">Ngày tạo</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {returns.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                <RotateCcw size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="font-bold">Chưa có yêu cầu hoàn trả</p>
              </td></tr>
            ) : returns.map(rtn => (
              <tr key={rtn.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-4 py-3 font-bold text-indigo-700">{rtn.code}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{rtn.order.code}</td>
                <td className="px-4 py-3 font-medium">{rtn.order.customerName}</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded-full">{TYPE_LABELS[rtn.type] || rtn.type}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[rtn.status] || ''}`}>
                    {STATUS_LABELS[rtn.status] || rtn.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs">
                  {rtn.resolution ? RESOLUTION_LABELS[rtn.resolution] || rtn.resolution : '—'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-cyan-600">
                  {rtn.refundAmount > 0 ? `${fmt(rtn.refundAmount)}đ` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(rtn.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {rtn.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(rtn.id)}
                          className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700">Duyệt</button>
                        <button onClick={() => handleReject(rtn.id)}
                          className="px-2 py-1 text-[10px] font-bold text-red-600 border border-red-200 rounded hover:bg-red-50">Từ chối</button>
                      </>
                    )}
                    {['approved', 'processing'].includes(rtn.status) && (
                      <button onClick={() => setShowResolve(rtn)}
                        className="px-2 py-1 text-[10px] font-bold bg-green-600 text-white rounded hover:bg-green-700">Giải quyết</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <CreateReturnForm 
          onClose={() => setShowCreate(false)} 
          onSuccess={() => { setShowCreate(false); load(); }} 
        />
      )}

      {/* Resolve Modal */}
      {showResolve && (
        <ReturnDetailModal 
          showResolve={showResolve} 
          onClose={() => setShowResolve(null)} 
          onSuccess={() => { setShowResolve(null); load(); }} 
        />
      )}
    </div>
  );
}
