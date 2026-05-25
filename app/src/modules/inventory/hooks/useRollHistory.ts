import { useState, useEffect, useMemo } from 'react';
import { inventoryService } from '../services/inventory.service';
import { ProductRoll } from '../types';
import { utils, writeFile } from 'xlsx';

export function useRollHistory(subSku: string | undefined, filteredRolls: ProductRoll[]) {
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterDate, setHistoryFilterDate] = useState<string | null>(null);
  const [historyFilterType, setHistoryFilterType] = useState<string | null>(null);
  const [historyViewMode, setHistoryViewMode] = useState<'lifecycle' | 'orders'>('lifecycle');
  const [expandedQrCodes, setExpandedQrCodes] = useState<Set<string>>(new Set());
  const [rollTimelineCache, setRollTimelineCache] = useState<Record<string, { loading: boolean; events: any[] }>>({});

  useEffect(() => {
    if (subSku) {
      setLoadingHistory(true);
      inventoryService.getHistory(subSku)
        .then(res => setHistoryLogs(res))
        .catch(err => alert('Lỗi tải lịch sử: ' + (err.message || err)))
        .finally(() => setLoadingHistory(false));
    } else {
      setHistoryLogs([]);
    }
  }, [subSku]);

  const toggleExpand = (qrCode: string) => {
    setExpandedQrCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qrCode)) {
        newSet.delete(qrCode);
      } else {
        newSet.add(qrCode);
        if (!rollTimelineCache[qrCode]) {
          setRollTimelineCache(c => ({ ...c, [qrCode]: { loading: true, events: [] } }));
          inventoryService.getRollTimeline(qrCode).then(result => {
            setRollTimelineCache(c => ({ ...c, [qrCode]: { loading: false, events: result.events } }));
          }).catch(() => {
            setRollTimelineCache(c => ({ ...c, [qrCode]: { loading: false, events: [] } }));
          });
        }
      }
      return newSet;
    });
  };

  const dailyOverview = useMemo(() => {
    if (!historyLogs || historyLogs.length === 0) return [];
    const groups: Record<string, any> = {};
    historyLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, sanXuatNoi: 0, nhapNgoai: 0, xuatKho: 0, hoanTra: 0, loi: 0, hong: 0 };
      }
      const action = log.action.toLowerCase();
      if (action.includes('khởi tạo') || action.includes('nhập kho')) {
        if (log.sourceType === 'production') groups[dateKey].sanXuatNoi++;
        else groups[dateKey].nhapNgoai++;
      } else if (action.includes('xuất kho')) {
        groups[dateKey].xuatKho++;
      } else if (action.includes('hoàn kho') || action.includes('hoàn trả')) {
        groups[dateKey].hoanTra++;
      } else if (action.includes('hỏng') || action.includes('hàng hỏng')) {
        groups[dateKey].hong++;
      } else if (action.includes('lỗi') || action.includes('hàng lỗi')) {
        groups[dateKey].loi++;
      }
    });
    return Object.values(groups).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }, [historyLogs]);

  const filteredHistoryLogs = useMemo(() => {
    let logs = historyLogs;
    if (historyFilterDate) {
      logs = logs.filter(log => new Date(log.timestamp).toISOString().split('T')[0] === historyFilterDate);
    }
    if (historyFilterType) {
      if (historyFilterType === 'sanXuatNoi') logs = logs.filter(log => (log.action.toLowerCase().includes('khởi tạo') || log.action.toLowerCase().includes('nhập kho')) && log.sourceType === 'production');
      else if (historyFilterType === 'nhapNgoai') logs = logs.filter(log => (log.action.toLowerCase().includes('khởi tạo') || log.action.toLowerCase().includes('nhập kho')) && log.sourceType !== 'production');
      else if (historyFilterType === 'xuatKho') logs = logs.filter(log => log.action.toLowerCase().includes('xuất kho'));
      else if (historyFilterType === 'hoanTra') logs = logs.filter(log => log.action.toLowerCase().includes('hoàn kho') || log.action.toLowerCase().includes('hoàn trả'));
      else if (historyFilterType === 'hong') logs = logs.filter(log => log.action.toLowerCase().includes('hỏng') || log.action.toLowerCase().includes('hàng hỏng'));
      else if (historyFilterType === 'loi') logs = logs.filter(log => log.action.toLowerCase().includes('lỗi') || log.action.toLowerCase().includes('hàng lỗi'));
    }
    return logs;
  }, [historyLogs, historyFilterDate, historyFilterType]);

  const exportHistoryExcel = (subSkuSafe: string) => {
    if (filteredHistoryLogs.length === 0) return;
    const data = filteredHistoryLogs.map(log => ({
      'Ngày giờ': new Date(log.timestamp).toLocaleString('vi-VN'),
      'Mã Lệnh': log.orderCode || '',
      'Sub-SKU': log.subSku,
      'Sản phẩm': log.productName,
      'Mã QR': log.qrCode,
      'Thao tác / Nghiệp vụ': log.action,
      'Người thực hiện': log.operator || '',
      'Khách hàng': log.customerName || '',
      'Tài xế giao hàng': log.driverName || ''
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Lich_su');
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 30 }, { wch: 25 }];
    writeFile(wb, `Lich_Su_${subSkuSafe}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const jumpToHistory = (date: string, type: string) => {
    setHistoryFilterDate(date);
    setHistoryFilterType(type);
    setHistoryViewMode('orders');
  };

  const orderGroups = useMemo(() => {
    if (historyViewMode !== 'orders') return [];
    const groups: Record<string, { orderCode: string, action: string, timestamp: string, count: number, logs: any[] }> = {};
    filteredHistoryLogs.forEach(log => {
      const code = log.orderCode || 'Khác';
      if (!groups[code]) groups[code] = { orderCode: code, action: log.action, timestamp: log.timestamp, count: 0, logs: [] };
      groups[code].count++;
      groups[code].logs.push(log);
    });
    return Object.values(groups).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredHistoryLogs, historyViewMode]);

  const lifecycleGroups = useMemo(() => {
    if (historyViewMode !== 'lifecycle') return [];
    const groups: Record<string, { qrCode: string, logs: any[], status: string, roll: any | null, lastActionTimestamp: string }> = {};
    filteredHistoryLogs.forEach(log => {
      const code = log.qrCode;
      if (!groups[code]) groups[code] = { qrCode: code, logs: [], status: 'Chưa rõ', roll: null, lastActionTimestamp: '' };
      groups[code].logs.push(log);
    });
    Object.values(groups).forEach(group => {
      group.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latestLog = group.logs[0];
      group.lastActionTimestamp = latestLog.timestamp;
      const inStockRoll = filteredRolls.find(r => r.qrCode === group.qrCode);
      if (inStockRoll) {
        group.roll = inStockRoll;
        group.status = inStockRoll.status;
      } else {
        const action = latestLog.action.toLowerCase();
        if (action.includes('xuất')) group.status = 'Đã xuất kho';
        else if (action.includes('lỗi') || action.includes('hỏng')) group.status = 'Lỗi/Hỏng';
        else group.status = 'Không trong kho';
      }
    });
    return Object.values(groups).sort((a, b) => new Date(b.lastActionTimestamp).getTime() - new Date(a.lastActionTimestamp).getTime());
  }, [filteredHistoryLogs, historyViewMode, filteredRolls]);

  const exportOrderExcel = (orderCode: string, logs: any[], subSkuSafe: string) => {
    if (logs.length === 0) return;
    const data = logs.map(log => ({
      'Ngày giờ': new Date(log.timestamp).toLocaleString('vi-VN'),
      'Mã Lệnh': log.orderCode || '',
      'Sub-SKU': log.subSku,
      'Sản phẩm': log.productName,
      'Mã QR': log.qrCode,
      'Thao tác / Nghiệp vụ': log.action,
      'Người thực hiện': log.operator || '',
      'Khách hàng': log.customerName || '',
      'Tài xế giao hàng': log.driverName || ''
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Don_Hang');
    ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 35 }, { wch: 25 }, { wch: 30 }, { wch: 25 }];
    writeFile(wb, `Lich_Su_${subSkuSafe}_${orderCode}.xlsx`);
  };

  return {
    historyLogs,
    loadingHistory,
    historyFilterDate,
    setHistoryFilterDate,
    historyFilterType,
    setHistoryFilterType,
    historyViewMode,
    setHistoryViewMode,
    expandedQrCodes,
    toggleExpand,
    rollTimelineCache,
    dailyOverview,
    filteredHistoryLogs,
    exportHistoryExcel,
    jumpToHistory,
    orderGroups,
    lifecycleGroups,
    exportOrderExcel
  };
}
