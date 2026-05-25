import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { ClipboardCheck, Search, Plus, QrCode } from 'lucide-react';
import { formatDateTime } from '../../../utils/format';
import Badge from '../../../components/ui/Badge';

import api from '../../../services/api';
import { useSocket } from '../../../hooks/useSocket';

export default function StocktakeTab() {
  const [stocktakes, setStocktakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStocktakes = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/inventory/stocktakes');
      if (res.success) {
        setStocktakes(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocktakes();
  }, []);

  useSocket({ onInventoryUpdate: fetchStocktakes });

  const handleCreate = async () => {
    const warehouse = prompt('Nhập tên kho cần kiểm kê: (VD: KHO A)');
    if (!warehouse) return;

    try {
      const res = await api.post<{ success: boolean; message?: string }>('/inventory/stocktakes', { warehouse, notes: `Kiểm kê định kỳ ${warehouse}` });
      if (res.success) {
        fetchStocktakes();
      } else {
        alert(res.message);
      }
    } catch (error: any) {
      alert(error.message || 'Lỗi');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Quản lý Phiếu Kiểm Kê</h3>
        <Button className="gap-2 bg-blue-600" onClick={handleCreate}>
          <Plus className="w-4 h-4" /> Tạo Phiếu Kiểm Kê
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-bold text-slate-500">Mã Phiếu</th>
              <th className="p-4 font-bold text-slate-500">Kho / Khu vực</th>
              <th className="p-4 font-bold text-slate-500">Ngày tạo</th>
              <th className="p-4 font-bold text-slate-500">Người tạo</th>
              <th className="p-4 font-bold text-slate-500">Số lượng (Items)</th>
              <th className="p-4 font-bold text-slate-500">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Đang tải...</td></tr>
            ) : stocktakes.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">Chưa có phiếu kiểm kê nào</td></tr>
            ) : (
              stocktakes.map(s => (
                <tr key={s.id} className="border-b hover:bg-slate-50 cursor-pointer">
                  <td className="p-4 font-mono font-bold text-blue-600">{s.code}</td>
                  <td className="p-4">{s.warehouse || 'Tất cả'}</td>
                  <td className="p-4">{formatDateTime(s.createdAt)}</td>
                  <td className="p-4">{s.createdByName}</td>
                  <td className="p-4">{s._count?.items || 0}</td>
                  <td className="p-4">
                    {s.status === 'draft' ? <Badge variant="yellow">Đang kiểm kê</Badge> : <Badge variant="green">Hoàn thành</Badge>}
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
