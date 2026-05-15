/**
 * NotificationCenter — Live notification bell with dropdown
 * ──────────────────────────────────────────────────────────
 * Shows notification count badge and recent notification history.
 * Data from real-time API /notifications.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CreditCard, Truck, Package, AlertTriangle, RotateCcw, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

interface Notification {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  content: string;
  status: string;
  relatedId: string | null;
  sentAt: string;
}

interface NotifStats {
  total: number;
  sent: number;
  failed: number;
  today: number;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  debt_alert: { icon: <CreditCard size={14} />, color: '#f59e0b', label: 'Nhắc nợ' },
  order_status: { icon: <Truck size={14} />, color: '#3b82f6', label: 'Đơn hàng' },
  low_stock: { icon: <AlertTriangle size={14} />, color: '#ef4444', label: 'NVL sắp hết' },
  delivery_proof: { icon: <Package size={14} />, color: '#22c55e', label: 'Giao hàng' },
  return_update: { icon: <RotateCcw size={14} />, color: '#8b5cf6', label: 'Hoàn trả' },
  ocr_alert: { icon: <ShieldAlert size={14} />, color: '#e11d48', label: 'Gian lận OCR' },
  system_alert: { icon: <AlertTriangle size={14} />, color: '#fb923c', label: 'Hệ thống' },
};

export default function NotificationCenter({ placement = 'bottom' }: { placement?: 'bottom' | 'right' }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotifStats | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [notifs, st] = await Promise.all([
        api.get<Notification[]>('/notifications?limit=20'),
        api.get<NotifStats>('/notifications/stats'),
      ]);
      setNotifications(notifs || []);
      setStats(st);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const todayCount = stats?.today || 0;

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className={`p-2 rounded-lg transition-colors relative ${placement === 'right' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
      >
        <Bell className="w-5 h-5" />
        {todayCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
            {todayCount > 99 ? '99+' : todayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute ${placement === 'right' ? 'left-full ml-2 bottom-0' : 'right-0 top-full mt-2'} w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50`}
          style={{ maxHeight: '480px' }}>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Thông báo</h3>
              <div className="flex gap-2">
                {stats && (
                  <>
                    <span className="text-[10px] font-bold text-green-200 bg-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> {stats.sent}
                    </span>
                    {stats.failed > 0 && (
                      <span className="text-[10px] font-bold text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle size={10} /> {stats.failed}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-white/60 mt-0.5">Hôm nay: {todayCount} thông báo</p>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400 font-medium">Chưa có thông báo</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || { icon: <Bell size={14} />, color: '#6b7280', label: n.type };
                return (
                  <div key={n.id} onClick={() => { if(n.type === 'ocr_alert') window.location.href = '/ocr-audit'; }} className={`flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${n.type === 'ocr_alert' ? 'cursor-pointer' : ''}`}>
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className={`text-[9px] font-bold ${n.status === 'sent' ? 'text-green-500' : 'text-red-500'}`}>
                          {n.status === 'sent' ? '✓ Đã gửi' : '✗ Thất bại'}
                        </span>
                      </div>
                      <p className={`text-xs font-medium mt-0.5 truncate ${n.type === 'ocr_alert' ? 'text-rose-600' : 'text-gray-800'}`}>{n.subject}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.sentAt)} • {n.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
