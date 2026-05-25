import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Truck, ArrowRight, Plus } from 'lucide-react';
import { formatDateTime } from '../../../utils/format';
import Badge from '../../../components/ui/Badge';

import api from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

export default function TransferTab() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/inventory/transfers');
      if (res.success) {
        setTransfers(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  useSocket({ onInventoryUpdate: fetchTransfers });

  const handleCreate = async () => {
    const fromLocation = prompt('Từ kho/vị trí:');
    if (!fromLocation) return;
    const toLocation = prompt('Đến kho/vị trí:');
    if (!toLocation) return;
    const codes = prompt('Nhập mã các cuộn cần chuyển (cách nhau bởi dấu phẩy):');
    if (!codes) return;

    const rollCodes = codes.split(',').map(c => c.trim()).filter(Boolean);

    try {
      const res = await api.post<{ success: boolean; message?: string }>('/inventory/transfers', { fromLocation, toLocation, rollCodes, notes: `Chuyển kho tự động` });
      if (res.success) {
        fetchTransfers();
      } else {
        alert(res.message || 'Có lỗi xảy ra, có thể mã cuộn không đúng');
      }
    } catch (error: any) {
      alert(error.message || 'Lỗi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Lịch sử Chuyển kho (Internal Transfer)</h3>
        <Button className="gap-2 bg-blue-600" onClick={handleCreate}>
          <Plus className="w-4 h-4" /> Tạo Lệnh Chuyển
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-bold text-slate-500">Mã lệnh</th>
              <th className="p-4 font-bold text-slate-500">Từ vị trí</th>
              <th className="p-4 font-bold text-slate-500">Đến vị trí</th>
              <th className="p-4 font-bold text-slate-500">Số cuộn</th>
              <th className="p-4 font-bold text-slate-500">Thời gian</th>
              <th className="p-4 font-bold text-slate-500">Người thực hiện</th>
              <th className="p-4 font-bold text-slate-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center">Đang tải...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-slate-400">Chưa có lịch sử chuyển kho</td></tr>
            ) : (
              transfers.map(t => (
                <tr key={t.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-blue-600">{t.code}</td>
                  <td className="p-4 text-slate-600">{t.fromLocation}</td>
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-slate-400" /> {t.toLocation}
                  </td>
                  <td className="p-4">{t.items?.length || 0}</td>
                  <td className="p-4 text-slate-500">{formatDateTime(t.createdAt)}</td>
                  <td className="p-4">{t.createdByName}</td>
                  <td className="p-4">
                    <Badge variant="green">Đã chuyển</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
